import re

content = open("src/pages/dashboard/TasksPage.tsx").read()
# Remove firebase imports
content = re.sub(r"import \{.*?\} from 'firebase/firestore';\n", "", content)
content = re.sub(r"import \{ db, auth \} from '../../lib/firebase';\n", "", content)
content = re.sub(r"import \{ useAuth \} from '../../context/AuthContext';", "import { useAuth } from '../../context/AuthContext';\nimport { api } from '../../lib/api';", content)

# Update fetchTasks
fetch_tasks_new = """  const fetchTasks = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getTasks();
      const compData = await fetch('/api/tasks/completions').then(res => res.json());
      setTasks(data.tasks || []);
      const compMap: Record<string, 'PENDING' | 'COMPLETED' | 'REJECTED'> = {};
      if (compData.completions) {
        compData.completions.forEach((comp: any) => {
          compMap[comp.taskId] = comp.status;
        });
      }
      setCompletions(compMap);
    } catch (err: any) {
      console.error('Error fetching tasks', err);
      setError('حدث خطأ أثناء جلب المهام.');
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r"  const fetchTasks = async \(\) => \{.*?\n  \};", fetch_tasks_new, content, flags=re.DOTALL)

# Update handleCompleteTask
complete_task_new = """  const handleCompleteTask = async (task: Task) => {
    if (!profile) return;
    setSubmittingId(task.taskId || task.id);
    
    try {
      await api.completeTask(task.taskId || task.id);
      setCompletions(prev => ({ ...prev, [task.taskId || task.id]: 'PENDING' }));
    } catch (error: any) {
      console.error('Error completing task', error);
      alert(error.message || 'حدث خطأ أثناء إرسال المهمة.');
    } finally {
      setSubmittingId(null);
    }
  };"""
content = re.sub(r"  const handleCompleteTask = async \(task: Task\) => \{.*?\n  \};", complete_task_new, content, flags=re.DOTALL)

open("src/pages/dashboard/TasksPage.tsx", "w").write(content)
