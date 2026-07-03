import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

type Role = 'master' | 'admin' | 'teacher';
type Status = 'Оформлено' | 'В работе' | 'Выполнено';

interface Ticket {
  id: number;
  equipment: string;
  reason: string;
  room: string;
  building: string;
  status: Status;
  takenBy: string | null;
  author: string;
  createdAt: string;
}

interface User {
  name: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  master: 'Мастер',
  admin: 'Администратор',
  teacher: 'Преподаватель',
};

const DEMO_USERS: Record<string, User> = {
  master: { name: 'Иванов Сергей', role: 'master' },
  admin: { name: 'Петрова Ольга', role: 'admin' },
  teacher: { name: 'Смирнов Андрей', role: 'teacher' },
};

const STATUS_STYLES: Record<Status, string> = {
  Оформлено: 'bg-muted text-muted-foreground',
  'В работе': 'bg-accent/10 text-accent border border-accent/30',
  Выполнено: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 1042,
    equipment: 'Проектор Epson EB-X05',
    reason: 'Не включается, индикатор мигает красным',
    room: '312',
    building: 'Корпус А',
    status: 'В работе',
    takenBy: 'Иванов Сергей',
    author: 'Смирнов Андрей',
    createdAt: '03.07, 09:14',
  },
  {
    id: 1041,
    equipment: 'Компьютер Dell OptiPlex',
    reason: 'Не загружается ОС, чёрный экран',
    room: '204',
    building: 'Корпус Б',
    status: 'Оформлено',
    takenBy: null,
    author: 'Смирнов Андрей',
    createdAt: '03.07, 08:50',
  },
  {
    id: 1039,
    equipment: 'Интерактивная доска SMART',
    reason: 'Не реагирует на касания в левом углу',
    room: '118',
    building: 'Корпус А',
    status: 'Выполнено',
    takenBy: 'Петрова Ольга',
    author: 'Смирнов Андрей',
    createdAt: '02.07, 15:30',
  },
];

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loginRole, setLoginRole] = useState<Role>('master');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [statusFilter, setStatusFilter] = useState<'Все' | Status>('Все');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ equipment: '', reason: '', room: '', building: 'Корпус А' });

  const newCount = useMemo(
    () => tickets.filter((t) => t.status === 'Оформлено').length,
    [tickets],
  );

  const filtered = useMemo(
    () => (statusFilter === 'Все' ? tickets : tickets.filter((t) => t.status === statusFilter)),
    [tickets, statusFilter],
  );

  const createTicket = () => {
    if (!form.equipment || !form.reason || !form.room) return;
    const ticket: Ticket = {
      id: Math.max(...tickets.map((t) => t.id)) + 1,
      equipment: form.equipment,
      reason: form.reason,
      room: form.room,
      building: form.building,
      status: 'Оформлено',
      takenBy: null,
      author: user?.name ?? 'Гость',
      createdAt: 'сейчас',
    };
    setTickets([ticket, ...tickets]);
    setForm({ equipment: '', reason: '', room: '', building: 'Корпус А' });
    setDialogOpen(false);
  };

  const takeTicket = (id: number) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: 'В работе', takenBy: user?.name ?? null } : t,
      ),
    );
  };

  const completeTicket = (id: number) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Выполнено' } : t)),
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="w-full max-w-sm animate-scale-in">
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center">
              <Icon name="Wrench" size={18} className="text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">ТехПомощь</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-1.5">Вход в систему</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Выберите роль для входа. Студентов регистрирует администратор.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Роль
              </Label>
              <Select value={loginRole} onValueChange={(v) => setLoginRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master">Мастер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                  <SelectItem value="teacher">Преподаватель</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="login" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Логин
              </Label>
              <Input id="login" placeholder="Введите логин" defaultValue={DEMO_USERS[loginRole].name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Пароль
              </Label>
              <Input id="pass" type="password" placeholder="••••••••" defaultValue="demo" />
            </div>
            <Button className="w-full mt-2" onClick={() => setUser(DEMO_USERS[loginRole])}>
              Войти как {ROLE_LABELS[loginRole].toLowerCase()}
              <Icon name="ArrowRight" size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isMaster = user.role === 'master';
  const isAdmin = user.role === 'admin';
  const isTeacher = user.role === 'teacher';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Icon name="Wrench" size={16} className="text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">ТехПомощь</span>
          </div>

          <div className="flex items-center gap-3">
            {isMaster && newCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-pulse-dot" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
                <span className="text-xs font-medium text-accent">
                  {newCount} новых заявок
                </span>
              </div>
            )}
            <div className="flex items-center gap-2.5">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-tight">{user.name}</div>
                <div className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                {user.name.split(' ').map((n) => n[0]).join('')}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setUser(null)}>
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-10 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Заявки</h1>
            <p className="text-muted-foreground mt-1">
              {isMaster && 'Ремонтные заявки от преподавателей'}
              {isAdmin && 'Управление заявками и пользователями'}
              {isTeacher && 'Ваши заявки на ремонт оборудования'}
            </p>
          </div>

          {(isTeacher || isAdmin) && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={16} className="mr-1" />
                  Новая заявка
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая заявка на ремонт</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Наименование оборудования</Label>
                    <Input
                      placeholder="Например, проектор Epson"
                      value={form.equipment}
                      onChange={(e) => setForm({ ...form, equipment: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Причина поломки</Label>
                    <Textarea
                      placeholder="Опишите, что случилось"
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Аудитория</Label>
                      <Input
                        placeholder="312"
                        value={form.room}
                        onChange={(e) => setForm({ ...form, room: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Корпус</Label>
                      <Select
                        value={form.building}
                        onValueChange={(v) => setForm({ ...form, building: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Корпус А">Корпус А</SelectItem>
                          <SelectItem value="Корпус Б">Корпус Б</SelectItem>
                          <SelectItem value="Корпус В">Корпус В</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button onClick={createTicket}>Создать заявку</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {(['Все', 'Оформлено', 'В работе', 'Выполнено'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((t, i) => (
            <div
              key={t.id}
              className="group border rounded-lg bg-card p-5 hover:shadow-sm transition-shadow animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground">#{t.id}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status]}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg tracking-tight truncate">{t.equipment}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{t.reason}</p>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Icon name="DoorOpen" size={14} /> Ауд. {t.room}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="Building2" size={14} /> {t.building}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="User" size={14} /> {t.author}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="Clock" size={14} /> {t.createdAt}
                    </span>
                  </div>

                  {t.takenBy && (
                    <div className="mt-3 pt-3 border-t text-sm flex items-center gap-1.5">
                      <Icon name="CircleCheck" size={14} className="text-accent" />
                      <span className="text-muted-foreground">Взял в работу:</span>
                      <span className="font-medium">{t.takenBy}</span>
                    </div>
                  )}
                </div>

                {(isMaster || isAdmin) && (
                  <div className="flex flex-col gap-2 shrink-0">
                    {t.status === 'Оформлено' && (
                      <Button size="sm" onClick={() => takeTicket(t.id)}>
                        Взять в работу
                      </Button>
                    )}
                    {t.status === 'В работе' && (
                      <Button size="sm" variant="outline" onClick={() => completeTicket(t.id)}>
                        <Icon name="Check" size={14} className="mr-1" />
                        Выполнено
                      </Button>
                    )}
                    {t.status === 'Выполнено' && (
                      <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium px-2">
                        <Icon name="CircleCheck" size={16} /> Готово
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Icon name="Inbox" size={40} className="mx-auto mb-3 opacity-40" />
              <p>Нет заявок в этой категории</p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="mt-12 border rounded-lg bg-card p-6 animate-fade-in">
            <div className="flex items-center gap-2 mb-1">
              <Icon name="Users" size={18} />
              <h2 className="font-semibold text-lg tracking-tight">Управление студентами</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              Администратор регистрирует студентов для входа в систему.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="Фамилия Имя" />
              <Input placeholder="Логин студента" />
              <Button>
                <Icon name="UserPlus" size={16} className="mr-1" />
                Зарегистрировать
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
