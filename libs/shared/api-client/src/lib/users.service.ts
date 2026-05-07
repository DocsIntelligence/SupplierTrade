import type { UpdateUserDto, User } from '@org/dto';
import type { HttpClient } from './http';

export const createUsersService = (http: HttpClient) => ({
  list: () => http.get<User[]>('/users').then((r) => r.data),
  byId: (id: string) => http.get<User>(`/users/${id}`).then((r) => r.data),
  update: (id: string, payload: UpdateUserDto) =>
    http.patch<User>(`/users/${id}`, payload).then((r) => r.data),
  remove: (id: string) =>
    http.delete<{ ok: true }>(`/users/${id}`).then((r) => r.data),
});

export type UsersService = ReturnType<typeof createUsersService>;
