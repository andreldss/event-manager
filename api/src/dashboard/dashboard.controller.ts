import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { AuthUser } from '../common/types/auth-user.js';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Req() req: Request & { user: AuthUser }) {
    return this.dashboardService.getSummary(req.user);
  }
}
