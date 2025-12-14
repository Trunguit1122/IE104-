import { AppDataSource } from "../data-source";
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
  UserDetailResponseDTO,
  UserListDTO,
} from "../dtos/user.dto";
import { User, UserRole, UserStatus } from "../entities/User";
import { createPaginatedResponse } from "../utils/pagination.utils";
import { PaginatedResponseDTO } from "../dtos/pagination.dto";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  // Create user
  async createUser(dto: CreateUserDTO): Promise<UserResponseDTO> {
    // Check if email already exists
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new Error("Email already registered");
    }

    const user = this.userRepository.create({
      email: dto.email,
      password: dto.password, // Note: Should be hashed in real implementation
      role: dto.role || UserRole.LEARNER,
      uiLanguage: dto.uiLanguage,
    });

    const saved = await this.userRepository.save(user);
    return this.mapToResponseDTO(saved);
  }

  // Get user by ID
  async getUserById(id: string): Promise<UserDetailResponseDTO> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ["learnerProfile"],
    });
    if (!user) {
      throw new Error("User not found");
    }
    return this.mapToDetailResponseDTO(user);
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("User not found");
    }
    return this.mapToResponseDTO(user);
  }

  // Get all users
  async getAllUsers(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<UserListDTO>> {
    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      users.map((u) => this.mapToListDTO(u)),
      total,
      limit,
      offset
    );
  }

  // Get users by role
  async getUsersByRole(
    role: UserRole,
    limit: number = 10,
    offset: number = 0
  ): Promise<PaginatedResponseDTO<UserListDTO>> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { role },
      take: limit,
      skip: offset,
    });
    return createPaginatedResponse(
      users.map((u) => this.mapToListDTO(u)),
      total,
      limit,
      offset
    );
  }

  // Get learners
  async getLearners(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<UserListDTO>> {
    return this.getUsersByRole(UserRole.LEARNER, limit, offset);
  }

  // Get teachers
  async getTeachers(limit: number = 10, offset: number = 0): Promise<PaginatedResponseDTO<UserListDTO>> {
    return this.getUsersByRole(UserRole.TEACHER, limit, offset);
  }

  // Update user
  async updateUser(id: string, dto: UpdateUserDTO): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }

    // Check if email is being changed and already exists
    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new Error("Email already registered");
      }
    }

    await this.userRepository.update(id, dto);
    const updated = await this.userRepository.findOne({ where: { id } });
    if (!updated) {
      throw new Error("Failed to update user");
    }

    return this.mapToResponseDTO(updated);
  }

  // Lock user account
  async lockUserAccount(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }
    await this.userRepository.update(id, { status: UserStatus.LOCKED });
    const updated = await this.userRepository.findOne({ where: { id } });
    return this.mapToResponseDTO(updated!);
  }

  // Unlock user account
  async unlockUserAccount(id: string): Promise<UserResponseDTO> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }
    await this.userRepository.update(id, { status: UserStatus.ACTIVE });
    const updated = await this.userRepository.findOne({ where: { id } });
    return this.mapToResponseDTO(updated!);
  }

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new Error("User not found");
    }
    const result = await this.userRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Search users
  async searchUsers(query: string, limit: number = 10): Promise<UserListDTO[]> {
    const users = await this.userRepository.find({
      where: [{ email: query }, { password: query }],
      take: limit,
    });
    return users.map((u) => this.mapToListDTO(u));
  }

  // Mappers
  private mapToResponseDTO(user: User): UserResponseDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      uiLanguage: user.uiLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapToDetailResponseDTO(user: User): UserDetailResponseDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      uiLanguage: user.uiLanguage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      learnerProfile: user.learnerProfile
        ? {
            id: user.learnerProfile.id,
            userId: user.learnerProfile.userId,
            firstName: user.learnerProfile.firstName,
            lastName: user.learnerProfile.lastName,
            targetBand: user.learnerProfile.targetBand,
            currentBand: user.learnerProfile.currentBand,
            nativeLanguage: user.learnerProfile.nativeLanguage,
            learningGoals: user.learnerProfile.learningGoals,
          }
        : undefined,
      taughtClasses: user.taughtClasses?.map((c) => ({
        id: c.id,
        teacherId: c.teacherId,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      enrolledClasses: user.enrolledClasses?.map((c) => ({
        id: c.id,
        teacherId: c.teacherId,
        name: c.name,
        description: c.description,
        code: c.code,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  private mapToListDTO(user: User): UserListDTO {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    };
  }
}
