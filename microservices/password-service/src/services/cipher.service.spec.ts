import { Test, TestingModule } from '@nestjs/testing';
import { CipherService } from './cipher.service';

describe('CipherService', () => {
  let service: CipherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CipherService],
    }).compile();

    service = module.get<CipherService>(CipherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('encryptPassword and decryptPassword', () => {
    it('should encrypt and decrypt password correctly', () => {
      const password = 'mySecretPassword123!';
      const masterKey = 'myMasterKey456!';

      const encrypted = service.encryptPassword(password, masterKey);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(password);

      const decrypted = service.decryptPassword(encrypted, masterKey);
      expect(decrypted).toBe(password);
    });

    it('should not decrypt with wrong master key', () => {
      const password = 'mySecretPassword123!';
      const masterKey = 'myMasterKey456!';
      const wrongKey = 'wrongMasterKey789!';

      const encrypted = service.encryptPassword(password, masterKey);
      const decrypted = service.decryptPassword(encrypted, wrongKey);

      expect(decrypted).not.toBe(password);
      expect(decrypted).toBe('');
    });
  });

  describe('hashMasterKey and verifyMasterKey', () => {
    it('should hash and verify master key correctly', async () => {
      const masterKey = 'myMasterKey456!';

      const hash = await service.hashMasterKey(masterKey);
      expect(hash).toBeDefined();
      expect(hash).not.toBe(masterKey);

      const isValid = await service.verifyMasterKey(masterKey, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for wrong master key', async () => {
      const masterKey = 'myMasterKey456!';
      const wrongKey = 'wrongMasterKey789!';

      const hash = await service.hashMasterKey(masterKey);
      const isValid = await service.verifyMasterKey(wrongKey, hash);

      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same key (salt)', async () => {
      const masterKey = 'myMasterKey456!';

      const hash1 = await service.hashMasterKey(masterKey);
      const hash2 = await service.hashMasterKey(masterKey);

      expect(hash1).not.toBe(hash2);

      // Pero ambas deben verificar correctamente
      const isValid1 = await service.verifyMasterKey(masterKey, hash1);
      const isValid2 = await service.verifyMasterKey(masterKey, hash2);

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });
});

