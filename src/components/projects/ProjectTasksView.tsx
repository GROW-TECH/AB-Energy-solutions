import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ProjectTask, ProjectStage, Role } from '../../types';
import { 
  CheckSquare, Plus, Search, Filter, Calendar, User, Clock, 
  AlertTriangle, CheckCircle2, ChevronRight, FolderKanban, Tag, X
} from 'lucide-react';

export const ProjectTasksView: React.FC = () => {
  const { projects, updateProjectTask, addProjectTask, employees } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // New task form state
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStage, setTaskStage] = useState<ProjectStage>('Installation In Progress');
  const [taskRole, setTaskRole] = useState<Role>('Installation Team');
  const [taskAssignee, setTaskAssignee] = useState(employees[4]?.name || 'Ramesh Patel');
  const [taskDueDate, setTaskDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);

  // Flatten all tasks from all projects with parent project info
  const allTasksWithProject = projects.flatMap(proj => 
    proj.tasks.map(task => ({
      ...task,
      projectId: proj.id,
      customerName: proj.customerName,
      capacityKw: proj.capacityKw,
      projectStage: proj.stage,
    }))
  );

  const filteredTasks = allTasksWithProject.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProjectId === 'all' || task.projectId === selectedProjectId;
    const matchesStage = selectedStage === 'all' || task.stage === selectedStage;
    const matchesStatus = statusFilter === 'all' ? true : statusFilter === 'completed' ? task.isCompleted : !task.isCompleted;

    return matchesSearch && matchesProject && matchesStage && matchesStatus;
  });

  const totalTasks = allTasksWithProject.length;
  const completedCount = allTasksWithProject.filter(t => t.isCompleted).length;
  const pendingCount = totalTasks - completedCount;
  const overdueCount = allTasksWithProject.filter(t => !t.isCompleted && new Date(t.dueDate) < new Date()).length;

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !targetProjectId) return;

    addProjectTask(targetProjectId, {
      title: taskTitle.trim(),
      stage: taskStage,
      assignedRole: taskRole,
      assignedToName: taskAssignee,
      dueDate: taskDueDate,
    });

    setTaskTitle('');
    setShowNewTaskModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckSquare className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Project Tasks & Execution</h1>
              <p className="text-xs text-slate-500">Autonomous workflow checkpoints across active EPC solar installations</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Tasks</span>
            <FolderKanban className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalTasks}</div>
          <div className="mt-1 text-[11px] text-slate-400">Across {projects.length} solar installations</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">{completedCount}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            {totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0}% completion rate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Pending Execution</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{pendingCount}</div>
          <div className="mt-1 text-[11px] text-slate-400">Assigned to PMs & field teams</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Overdue Tasks</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600">{overdueCount}</div>
          <div className="mt-1 text-[11px] text-amber-700 font-medium">Needs immediate field follow-up</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title, customer, or engineer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Project */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Solar Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.id} - {p.customerName} ({p.capacityKw} kW)
                </option>
              ))}
            </select>

            {/* Filter by Stage */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stages</option>
              <option value="Booking">Booking</option>
              <option value="Documentation">Documentation</option>
              <option value="Material Planning">Material Planning</option>
              <option value="Material Ready">Material Ready</option>
              <option value="Installation Scheduled">Installation Scheduled</option>
              <option value="Installation In Progress">Installation In Progress</option>
              <option value="Installation Completed">Installation Completed</option>
              <option value="Testing">Testing</option>
              <option value="Commissioning">Commissioning</option>
              <option value="Net Metering">Net Metering</option>
              <option value="Completed">Completed</option>
            </select>

            {/* Filter by Completion Status */}
            <div className="flex items-center border border-slate-300 rounded-lg p-0.5 bg-slate-50 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'all' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'pending' ? 'bg-white shadow-xs text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === 'completed' ? 'bg-white shadow-xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">Status</th>
                <th className="py-3.5 px-4">Task Details</th>
                <th className="py-3.5 px-4">Project & Customer</th>
                <th className="py-3.5 px-4">Project Stage</th>
                <th className="py-3.5 px-4">Assigned To</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CheckSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-slate-600">No project tasks found</p>
                    <p className="text-[11px] text-slate-400">Try changing your filters or create a new task</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = !task.isCompleted && new Date(task.dueDate) < new Date();
                  return (
                    <tr key={`${task.projectId}-${task.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => updateProjectTask(task.projectId, task.id, !task.isCompleted)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                            task.isCompleted 
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                              : 'border-slate-300 hover:border-emerald-500 bg-white'
                          }`}
                          title={task.isCompleted ? 'Mark pending' : 'Mark completed'}
                        >
                          {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span className={task.isCompleted ? 'line-through text-slate-400' : ''}>
                            {task.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Task ID: {task.id}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{task.customerName}</div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          {task.projectId} ({task.capacityKw} kW)
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {task.stage}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                            {task.assignedToName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{task.assignedToName}</div>
                            <div className="text-[10px] text-slate-400">{task.assignedRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`} />
                          <span className={`font-medium ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                            {task.dueDate}
                          </span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                        {task.isCompleted && task.completedAt && (
                          <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                            Completed {task.completedAt.split('T')[0]}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => updateProjectTask(task.projectId, task.id, !task.isCompleted)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            task.isCompleted
                              ? 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {task.isCompleted ? 'Reopen' : 'Complete'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Task Modal */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Add New Project Task</h3>
              </div>
              <button 
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Solar Project *</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {projects.filter(p => p.stage !== 'Completed').map(p => (
                    <option key={p.id} value={p.id}>
                      {p.id} — {p.customerName} ({p.capacityKw} kW) [{p.stage}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title / Activity *</label>
                <input
                  type="text"
                  placeholder="e.g., Pull 4mm² UV DC cables through conduits & crimp MC4 connectors"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Execution Stage</label>
                  <select
                    value={taskStage}
                    onChange={(e) => setTaskStage(e.target.value as ProjectStage)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Booking">Booking</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Material Planning">Material Planning</option>
                    <option value="Material Ready">Material Ready</option>
                    <option value="Installation Scheduled">Installation Scheduled</option>
                    <option value="Installation In Progress">Installation In Progress</option>
                    <option value="Installation Completed">Installation Completed</option>
                    <option value="Testing">Testing</option>
                    <option value="Commissioning">Commissioning</option>
                    <option value="Net Metering">Net Metering</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date *</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department / Role</label>
                  <select
                    value={taskRole}
                    onChange={(e) => setTaskRole(e.target.value as Role)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Installation Team">Installation Team</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Survey Engineer">Survey Engineer</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assignee Name</label>
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
