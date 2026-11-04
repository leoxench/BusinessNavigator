import { Body, Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Публічний профіль людини. */
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.users.findById(id);
  }

  /** Редагування власного профілю. */
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() userId: number, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(userId, dto);
  }
}
