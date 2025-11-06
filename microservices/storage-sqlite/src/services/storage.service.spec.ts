import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StorageService } from './storage.service';
import { PasswordManager } from '../entities/password-manager.entity';

describe('StorageService', () => {
  let service: StorageService;
  let repository: Repository<PasswordManager>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: getRepositoryToken(PasswordManager),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    repository = module.get<Repository<PasswordManager>>(
      getRepositoryToken(PasswordManager),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all items', async () => {
      const mockItems: PasswordManager[] = [
        {
          id: 1,
          title: 'Test',
          description: 'Test description',
          username: 'user',
          encryptedPassword: 'encrypted',
          url: 'https://test.com',
          category: 'test',
          notes: 'notes',
          masterKeyHash: 'hash',
          createdAt: new Date(),
          updateAt: new Date(),
          version: 1,
          state: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(mockItems);

      const result = await service.findAll();

      expect(result.data).toEqual(mockItems);
      expect(result.error).toBeUndefined();
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should handle errors and return error response', async () => {
      mockRepository.find.mockRejectedValue(new Error('Database error'));

      const result = await service.findAll();

      expect(result.error).toBeDefined();
      if (result.error) {
        expect(result.error.code).toBe('STORAGE_ERROR');
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const mockData: Partial<PasswordManager> = {
        title: 'Test',
        username: 'user',
        encryptedPassword: 'encrypted',
        category: 'test',
        masterKeyHash: 'hash',
      };

      const mockCreated: PasswordManager = {
        id: 1,
        ...mockData,
        description: '',
        url: '',
        notes: '',
        createdAt: new Date(),
        updateAt: new Date(),
        version: 1,
        state: 1,
      } as PasswordManager;

      mockRepository.create.mockReturnValue(mockCreated);
      mockRepository.save.mockResolvedValue(mockCreated);

      const result = await service.create(mockData);

      expect(result.data).toEqual(mockCreated);
      expect(result.error).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledWith(mockData);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return an item by id', async () => {
      const mockItem: PasswordManager = {
        id: 1,
        title: 'Test',
        description: 'Test description',
        username: 'user',
        encryptedPassword: 'encrypted',
        url: 'https://test.com',
        category: 'test',
        notes: 'notes',
        masterKeyHash: 'hash',
        createdAt: new Date(),
        updateAt: new Date(),
        version: 1,
        state: 1,
      };

      mockRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.findOne(1);

      expect(result.data).toEqual(mockItem);
      expect(result.error).toBeUndefined();
    });

    it('should return NOT_FOUND error when item does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result.error).toBeDefined();
      if (result.error) {
        expect(result.error.code).toBe('NOT_FOUND');
        expect(result.error.retryable).toBe(false);
      }
    });
  });

  describe('update', () => {
    it('should update an existing item', async () => {
      const existingItem: PasswordManager = {
        id: 1,
        title: 'Old Title',
        description: 'Old description',
        username: 'user',
        encryptedPassword: 'encrypted',
        url: 'https://test.com',
        category: 'test',
        notes: 'notes',
        masterKeyHash: 'hash',
        createdAt: new Date(),
        updateAt: new Date(),
        version: 1,
        state: 1,
      };

      const updateData: Partial<PasswordManager> = {
        title: 'New Title',
      };

      const updatedItem = { ...existingItem, ...updateData };

      mockRepository.findOne.mockResolvedValue(existingItem);
      mockRepository.save.mockResolvedValue(updatedItem);

      const result = await service.update(1, updateData);

      expect(result.data).toEqual(updatedItem);
      expect(result.error).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete an existing item', async () => {
      const mockItem: PasswordManager = {
        id: 1,
        title: 'Test',
        description: 'Test description',
        username: 'user',
        encryptedPassword: 'encrypted',
        url: 'https://test.com',
        category: 'test',
        notes: 'notes',
        masterKeyHash: 'hash',
        createdAt: new Date(),
        updateAt: new Date(),
        version: 1,
        state: 1,
      };

      mockRepository.findOne.mockResolvedValue(mockItem);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.delete(1);

      expect(result.data.id).toBe(1);
      expect(result.data.deleted).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});

