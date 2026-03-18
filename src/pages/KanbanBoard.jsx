import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    DndContext, 
    DragOverlay, 
    closestCorners, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
    arrayMove, 
    SortableContext, 
    sortableKeyboardCoordinates, 
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
    Clock, 
    User, 
    AlertTriangle, 
    MessageSquare, 
    MoreVertical,
    CheckCircle,
    PlayCircle,
    PauseCircle,
    ChevronRight,
    Search,
    Filter
} from 'lucide-react';
import API from '../lib/axios';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { getSlaStatus } from '../lib/utils';

const COLUMNS = [
    { id: 'Open', title: 'New Tickets', color: 'border-blue-500/50', bg: 'bg-blue-500/10', icon: Clock },
    { id: 'Assigned', title: 'Assigned', color: 'border-violet-500/50', bg: 'bg-violet-500/10', icon: User },
    { id: 'In Progress', title: 'In Progress', color: 'border-amber-500/50', bg: 'bg-amber-500/10', icon: PlayCircle },
    { id: 'Pending', title: 'On Hold', color: 'border-slate-500/50', bg: 'bg-slate-500/10', icon: PauseCircle },
    { id: 'Resolved', title: 'Resolved', color: 'border-emerald-500/50', bg: 'bg-emerald-500/10', icon: CheckCircle }
];

const SortableTask = ({ ticket }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: ticket._id,
        data: {
            type: 'Task',
            ticket
        }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1
    };

    const priorityColors = {
        Low: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        High: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
        Critical: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
    };

    const sla = getSlaStatus(ticket.slaDeadline, ticket.status);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group relative bg-[#1e293b]/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 mb-3 hover:border-white/10 hover:bg-[#1e293b]/60 transition-all cursor-grab active:cursor-grabbing shadow-lg"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${priorityColors[ticket.priority]}`}>
                        {ticket.priority}
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border border-white/5 bg-dark-900 ${sla.color}`}>
                        <Clock className="w-3 h-3" />
                        {sla.label}
                    </span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">#{ticket.ticketId}</span>
            </div>
            
            <h4 className="text-sm font-semibold text-slate-200 line-clamp-2 mb-3">
                {ticket.title}
            </h4>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-[10px] font-bold text-primary-400 border border-primary-500/30">
                        {ticket.createdBy?.name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 leading-tight truncate max-w-[80px]">
                            {ticket.createdBy?.name}
                        </p>
                        <p className="text-[9px] text-slate-600">
                            {formatDistanceToNow(new Date(ticket.createdAt))} ago
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to={`/tickets/${ticket._id}`} onPointerDown={(e) => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

const KanbanBoard = () => {
    const queryClient = useQueryClient();
    const [activeTicket, setActiveTicket] = useState(null);
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const { data: ticketsResponse, isLoading } = useQuery({
        queryKey: ['tickets', 'all'],
        queryFn: async () => {
            const res = await API.get('/tickets', { params: { limit: 100 } });
            return res.data;
        }
    });

    const { data: categoriesData } = useQuery({
        queryKey: ['ticket-categories'],
        queryFn: async () => {
            const res = await API.get('/tickets/categories');
            return res.data.categories || [];
        }
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }) => {
            return await API.put(`/tickets/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['tickets']);
            toast.success('Ticket status updated');
        },
        onError: () => toast.error('Failed to update status')
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (isLoading) return <LoadingSpinner fullScreen />;

    const tickets = ticketsResponse?.tickets || [];
    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                            t.ticketId.toLowerCase().includes(search.toLowerCase());
        const matchesPriority = priorityFilter ? t.priority === priorityFilter : true;
        const matchesCategory = categoryFilter ? t.category === categoryFilter : true;
        return matchesSearch && matchesPriority && matchesCategory;
    });

    const onDragStart = (event) => {
        if (event.active.data.current?.type === 'Task') {
            setActiveTicket(event.active.data.current.ticket);
        }
    };

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;
    };

    const onDragEnd = (event) => {
        const { active, over } = event;
        setActiveTicket(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (COLUMNS.some(col => col.id === overId)) {
            const ticket = tickets.find(t => t._id === activeId);
            if (ticket && ticket.status !== overId) {
                updateStatusMutation.mutate({ id: activeId, status: overId });
            }
        }
    };

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Kanban Workspace</h1>
                    <p className="text-slate-400 text-sm">Organize and manage active tickets</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative group min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-primary-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Find ticket..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-all font-medium"
                        />
                    </div>

                    <select 
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                    >
                        <option value="">Priority</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>

                    <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary-500/50 max-w-[150px]"
                    >
                        <option value="">Category</option>
                        {categoriesData?.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>

                    {(search || priorityFilter || categoryFilter) && (
                        <button 
                            onClick={() => { setSearch(''); setPriorityFilter(''); setCategoryFilter(''); }}
                            className="text-xs text-slate-500 hover:text-white transition-colors underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Board */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    {COLUMNS.map(col => (
                        <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full">
                            <div className={`p-4 border-b-2 ${col.color} bg-[#1e293b]/40 rounded-t-2xl flex items-center justify-between`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${col.bg} flex items-center justify-center`}>
                                        <col.icon className="w-4 h-4 text-slate-300" />
                                    </div>
                                    <h3 className="font-bold text-slate-200 text-sm">{col.title}</h3>
                                </div>
                                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500">
                                    {filteredTickets.filter(t => t.status === col.id).length}
                                </span>
                            </div>
                            
                            <div className="flex-1 p-3 bg-black/10 rounded-b-2xl overflow-y-auto">
                                <SortableContext
                                    id={col.id}
                                    items={filteredTickets.filter(t => t.status === col.id).map(t => t._id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <DroppableContainer id={col.id}>
                                        {filteredTickets
                                            .filter(t => t.status === col.id)
                                            .map(ticket => (
                                                <SortableTask key={ticket._id} ticket={ticket} />
                                            ))}
                                        {filteredTickets.filter(t => t.status === col.id).length === 0 && (
                                            <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center opacity-30">
                                                <p className="text-xs text-slate-400">Empty</p>
                                            </div>
                                        )}
                                    </DroppableContainer>
                                </SortableContext>
                            </div>
                        </div>
                    ))}
                </div>

                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}>
                    {activeTicket ? (
                        <div className="bg-[#1e293b] border border-primary-500/50 rounded-xl p-4 shadow-2xl scale-105 rotate-2 cursor-grabbing">
                            <h4 className="text-sm font-semibold text-white mb-2">{activeTicket.title}</h4>
                            <span className="text-[10px] text-primary-400 font-mono">#{activeTicket.ticketId}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
};

const DroppableContainer = ({ id, children }) => {
    const { setNodeRef } = useSortable({
        id,
        data: {
            type: 'Column'
        }
    });

    return (
        <div ref={setNodeRef} className="min-h-full">
            {children}
        </div>
    );
};

export default KanbanBoard;
