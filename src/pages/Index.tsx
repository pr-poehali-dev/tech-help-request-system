import { useState, useMemo, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { AUTH_URL, TICKETS_URL } from '@/lib/api';
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
import { Checkbox } from '@/components/ui/checkbox';

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
  id?: number;
  name: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  master: 'Мастер',
  admin: 'Администратор',
  teacher: 'Преподаватель',
};

const STATUS_STYLES: Record<Status, string> = {
  Оформлено: 'bg-muted text-muted-foreground',
  'В работе': 'bg-accent/10 text-accent border border-accent/30',
  Выполнено: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState({ login: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<'Все' | Status>('Все');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [form, setForm] = useState({ equipment: '', reason: '', room: '', building: 'Корпус А' });
  const [student, setStudent] = useState({ full_name: '', login: '', password: '' });
  const [profile, setProfile] = useState({ full_name: '', password: '' });

  const newCount = useMemo(
    () => tickets.filter((t) => t.status === 'Оформлено').length,
    [tickets],
  );

  const filtered = useMemo(
    () => (statusFilter === 'Все' ? tickets : tickets.filter((t) => t.status === statusFilter)),
    [tickets, statusFilter],
  );

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch(TICKETS_URL);
      const data = await res.json();
      setTickets(data.tickets ?? []);
    } catch {
      toast({ title: 'Не удалось загрузить заявки', variant: 'destructive' });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadTickets();
    setProfile({ full_name: user.name, password: '' });
    if (user.role === 'master') {
      const interval = setInterval(loadTickets, 8000);
      return () => clearInterval(interval);
    }
  }, [user, loadTickets]);

  const doLogin = async () => {
    setLoggingIn(true);
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...credentials }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Ошибка входа', variant: 'destructive' });
        return;
      }
      setUser(data.user);
    } catch {
      toast({ title: 'Сервер недоступен', variant: 'destructive' });
    } finally {
      setLoggingIn(false);
    }
  };

  const createTicket = async () => {
    if (!form.equipment || !form.reason || !form.room) return;
    try {
      const res = await fetch(TICKETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, author: user?.name ?? 'Гость' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Ошибка', variant: 'destructive' });
        return;
      }
      setTickets((prev) => [data.ticket, ...prev]);
      setForm({ equipment: '', reason: '', room: '', building: 'Корпус А' });
      setDialogOpen(false);
      toast({ title: 'Заявка создана' });
    } catch {
      toast({ title: 'Сервер недоступен', variant: 'destructive' });
    }
  };

  const updateStatus = async (id: number, status: Status, takenBy?: string) => {
    try {
      const res = await fetch(TICKETS_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, takenBy }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setTickets((prev) => prev.map((t) => (t.id === id ? data.ticket : t)));
    } catch {
      toast({ title: 'Сервер недоступен', variant: 'destructive' });
    }
  };

  const takeTicket = (id: number) => updateStatus(id, 'В работе', user?.name ?? undefined);
  const completeTicket = (id: number) => updateStatus(id, 'Выполнено');

  const registerStudent = async () => {
    if (!student.full_name || !student.login || !student.password) return;
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...student }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Ошибка', variant: 'destructive' });
        return;
      }
      setStudent({ full_name: '', login: '', password: '' });
      toast({ title: `Студент ${data.full_name} зарегистрирован` });
    } catch {
      toast({ title: 'Сервер недоступен', variant: 'destructive' });
    }
  };

  const updateProfile = async () => {
    if (!user?.id || !profile.full_name || !profile.password) return;
    try {
      const res = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', id: user.id, ...profile }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? 'Ошибка', variant: 'destructive' });
        return;
      }
      setUser(data.user);
      setProfileOpen(false);
      toast({ title: 'Профиль обновлён' });
    } catch {
      toast({ title: 'Сервер недоступен', variant: 'destructive' });
    }
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
            Введите логин и пароль. Студентов регистрирует администратор.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Логин
              </Label>
              <Input
                id="login"
                placeholder="Введите логин"
                value={credentials.login}
                onChange={(e) => setCredentials({ ...credentials, login: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pass" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Пароль
              </Label>
              <Input
                id="pass"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-pass"
                checked={showPassword}
                onCheckedChange={(v) => setShowPassword(v === true)}
              />
              <Label htmlFor="show-pass" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Показать пароль
              </Label>
            </div>
            <Button className="w-full mt-2" onClick={doLogin} disabled={loggingIn}>
              {loggingIn ? 'Вход...' : 'Вход'}
              {!loggingIn && <Icon name="ArrowRight" size={16} className="ml-1" />}
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
            <div
              className={`flex items-center gap-2.5 ${isAdmin ? 'cursor-pointer' : ''}`}
              onClick={() => isAdmin && setProfileOpen(true)}
            >
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

      {isAdmin && (
        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Профиль администратора</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Фамилия Имя</Label>
                <Input
                  value={profile.full_name}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Новый пароль</Label>
                <Input
                  type="password"
                  placeholder="Введите новый пароль"
                  value={profile.password}
                  onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProfileOpen(false)}>
                Отмена
              </Button>
              <Button onClick={updateProfile}>Сохранить</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
            <div className="grid sm:grid-cols-4 gap-3">
              <Input
                placeholder="Фамилия Имя"
                value={student.full_name}
                onChange={(e) => setStudent({ ...student, full_name: e.target.value })}
              />
              <Input
                placeholder="Логин студента"
                value={student.login}
                onChange={(e) => setStudent({ ...student, login: e.target.value })}
              />
              <Input
                placeholder="Пароль студента"
                value={student.password}
                onChange={(e) => setStudent({ ...student, password: e.target.value })}
              />
              <Button onClick={registerStudent}>
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