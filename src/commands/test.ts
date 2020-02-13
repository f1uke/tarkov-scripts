import { ParsedArgs } from 'minimist';
import { getLocale } from '../static';
import { writeJSON } from 'fs-extra';

export default async function test(argv: ParsedArgs) {
  // try your requests here
  const locale = await getLocale();

  await writeJSON('itemMarketPrice.json', locale, { spaces: 2 });
}
