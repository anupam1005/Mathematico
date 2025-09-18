import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Course } from '../entities/Course';
import { Module } from '../entities/Module';
import { Lesson } from '../entities/Lesson';
import { Enrollment, EnrollmentStatus } from '../entities/Enrollment';
import { BaseRepository } from './base.repository';

export class CourseRepository extends BaseRepository<Course> {
  private moduleRepository: Repository<Module>;
  private lessonRepository: Repository<Lesson>;
  private enrollmentRepository: Repository<Enrollment>;

  constructor() {
    super(AppDataSource.getRepository(Course));
    this.moduleRepository = AppDataSource.getRepository(Module);
    this.lessonRepository = AppDataSource.getRepository(Lesson);
    this.enrollmentRepository = AppDataSource.getRepository(Enrollment);
  }

  async find(options?: FindManyOptions<Course>): Promise<Course[]> {
    return this.repository.find({
      ...options,
      relations: ['instructor'],
    });
  }

  async findAndCount(options?: FindManyOptions<Course>): Promise<[Course[], number]> {
    return this.repository.findAndCount({
      ...options,
      relations: ['instructor'],
    });
  }

  // Get only published courses for normal users
  async findPublishedCourses(options?: FindManyOptions<Course>): Promise<[Course[], number]> {
    return this.repository.findAndCount({
      ...options,
      where: {
        ...options?.where,
        isPublished: true,
        status: 'active'
      },
      relations: ['instructor'],
    });
  }

  // Get published course by ID for normal users
  async findPublishedCourseById(id: string): Promise<Course | null> {
    return this.repository.findOne({
      where: { 
        id,
        isPublished: true,
        status: 'active'
      },
      relations: ['instructor', 'modules', 'modules.lessons'],
    });
  }

  async findOne(options: FindOneOptions<Course>): Promise<Course | null> {
    return this.repository.findOne({
      ...options,
      relations: ['instructor', 'modules', 'modules.lessons'],
    });
  }

  async isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    const count = await this.enrollmentRepository.count({
      where: { userId, courseId },
    });
    return count > 0;
  }

  async enrollUser(userId: string, courseId: string): Promise<void> {
    const enrollment = this.enrollmentRepository.create({
      userId,
      courseId,
      enrolledAt: new Date(),
      status: EnrollmentStatus.ACTIVE,
    });
    await this.enrollmentRepository.save(enrollment);
  }

  async findUserEnrollments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<[any[], number]> {
    return this.enrollmentRepository.findAndCount({
      where: { userId },
      relations: ['course', 'course.instructor'],
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  // Module methods
  async addModule(courseId: string, moduleData: Omit<Partial<Module>, 'courseId' | 'position'>): Promise<Module> {
    const module = this.moduleRepository.create({
      ...moduleData,
      courseId,
      position: await this.getNextModuleOrder(courseId),
    } as Module);
    return this.moduleRepository.save(module);
  }

  async updateModule(
    id: string,
    updateData: Partial<Module>
  ): Promise<Module | null> {
    await this.moduleRepository.update(id, updateData);
    return this.moduleRepository.findOneBy({ id });
  }

  async getModule(id: string): Promise<Module | null> {
    return this.moduleRepository.findOneBy({ id });
  }

  async deleteModule(id: string) {
    return this.moduleRepository.softDelete(id);
  }

  // Lesson methods
  async addLesson(moduleId: string, lessonData: Omit<Partial<Lesson>, 'moduleId' | 'position'>): Promise<Lesson> {
    const lesson = this.lessonRepository.create({
      ...lessonData,
      moduleId,
      position: await this.getNextLessonOrder(moduleId),
    } as Lesson);
    return this.lessonRepository.save(lesson);
  }

  async updateLesson(
    id: string,
    updateData: Partial<Lesson>
  ): Promise<Lesson | null> {
    await this.lessonRepository.update(id, updateData);
    return this.lessonRepository.findOneBy({ id });
  }

  async getLesson(id: string): Promise<Lesson | null> {
    return this.lessonRepository.findOneBy({ id });
  }

  async deleteLesson(id: string) {
    return this.lessonRepository.softDelete(id);
  }

  // Helper methods
  private async getNextModuleOrder(courseId: string): Promise<number> {
    const lastModule = await this.moduleRepository.findOne({
      where: { courseId },
      order: { position: 'DESC' },
      select: ['position'],
    });
    return (lastModule?.position || 0) + 1;
  }

  private async getNextLessonOrder(moduleId: string): Promise<number> {
    const lastLesson = await this.lessonRepository.findOne({
      where: { moduleId },
      order: { position: 'DESC' },
      select: ['position'],
    });
    return (lastLesson?.position || 0) + 1;
  }
}
