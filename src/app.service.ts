import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private readonly _cacheManager: Cache, public con: ConfigService) { };

  async getKeyRedis(key: string) {
    try {
      let val = await this._cacheManager.get(key);
      console.log(`Gia tri key(${key}) la `, val);

      return val;

    } catch (error) {
      console.log("Loi nang~!!!!!!!!!!!!", error)
    }
  }

  /**
   * Save the public key client send. Then the server responds back UID.
   * @param {string} public_key 
   * @param
   * @returns UID generated by server
   */
  async savePublicKey(public_key: string) {
    try {
      const cat_id = await this.generateId();
      await this._cacheManager.set(cat_id, public_key);
      return cat_id;
    } catch (error) {
      console.log("savePublicKey Error:: ", error)
    }
  }

  async setNameCat() {
    type Cat = { name: string, id: string };
    // this._cacheManager.set(UID, cat);
  }

  private async generateId() {
    // const { nanoid } = await import('nanoid'); //dynamic import
    // //because it was an error when transpile to JS. ERR_REQUIRE_ESM

    let cat_id: string;
    let valCheck: unknown;
    do {
      cat_id = nanoid(10);
      valCheck = await this._cacheManager.get(cat_id);
      //generate again if UID duplicate.
    } while (valCheck != undefined);
    return cat_id;
  }
}
