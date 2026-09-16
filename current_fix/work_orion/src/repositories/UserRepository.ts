import { UserProfile } from '../types/auth';
import { userService } from '../services/userService';

export class UserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    return userService.getUserById(userId) || null;
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    const updated = await userService.updateUser(userId, data);
    if (!updated) throw new Error('User not found');
    return updated;
  }
}

export const userRepository = new UserRepository();

