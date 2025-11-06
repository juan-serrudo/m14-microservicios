import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CipherService {
  private readonly saltRounds = 12;

  encryptPassword(password: string, masterKey: string): string {
    return CryptoJS.AES.encrypt(password, masterKey).toString();
  }

  decryptPassword(encryptedPassword: string, masterKey: string): string {
    const decrypted = CryptoJS.AES.decrypt(encryptedPassword, masterKey);
    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  async hashMasterKey(masterKey: string): Promise<string> {
    return await bcrypt.hash(masterKey, this.saltRounds);
  }

  async verifyMasterKey(masterKey: string, hashedMasterKey: string): Promise<boolean> {
    return await bcrypt.compare(masterKey, hashedMasterKey);
  }
}

