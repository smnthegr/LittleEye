import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

const file = new URL('../../src/utils/philippine-address.ts', import.meta.url);
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, { module, exports: module.exports, require: createRequire(file) });
export const addresses = module.exports;
export const qcAddress = { street: '12 Sampaguita Street', localityCode: '1381300000', barangayCode: '1381300022', confirmed: true };
export const completeAddress = addresses.formatPhilippineAddress(qcAddress);
const phoneModule = { exports: {} };
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../../src/utils/phone-address.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { module: phoneModule, exports: phoneModule.exports, require(name) {
  if (name === './philippine-address') return addresses;
  throw new Error(name);
} });
export const phoneAddresses = phoneModule.exports;
