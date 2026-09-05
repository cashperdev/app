import { cashperApi } from '@/lib/cashper/api';

export const GET = (request: Request) => cashperApi.fetch(request);
