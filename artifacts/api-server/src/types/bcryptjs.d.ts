declare module "bcryptjs" {
  export function genSaltSync(rounds?: number): string;
  export function hashSync(data: string, saltOrRounds?: number | string): string;
  export function compareSync(data: string, encrypted: string): boolean;

  export function genSalt(rounds: number): string;
  export function genSalt(rounds: number, callback: (err: Error | null, salt: string) => void): void;
  export function hash(data: string, saltOrRounds: number | string): string;
  export function hash(data: string, saltOrRounds: number | string, callback: (err: Error | null, encrypted: string) => void): void;
  export function compare(data: string, encrypted: string): boolean;
  export function compare(data: string, encrypted: string, callback: (err: Error | null, res: boolean) => void): void;

  const bcrypt: {
    genSaltSync: typeof genSaltSync;
    hashSync: typeof hashSync;
    compareSync: typeof compareSync;
    genSalt: typeof genSalt;
    hash: typeof hash;
    compare: typeof compare;
  };

  export default bcrypt;
}
