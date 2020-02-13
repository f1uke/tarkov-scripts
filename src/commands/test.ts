import { ParsedArgs } from 'minimist';
import { searchMarket, buyOnMarket, sellOnMarket } from '../market';
import { SortType, SortDirection, CurrencyType, OwnerType } from '../types/market';

const targetItem = {
  name: 'RB-AM key',
  id: '5d80c88d86f77440556dbf07',
};

export default async function test(argv: ParsedArgs) {
  // try your requests here
  console.log(targetItem.id)
  const searchResults = await searchMarket({
    page: 1,
    limit: 10,
    sortType: SortType.Price,
    sortDirection: SortDirection.ASC,
    currency: CurrencyType.Rouble,
    removeBartering: true,
    offerOwnerType: OwnerType.Any,
    handbookId: targetItem.id,
  });
  console.log(searchResults)

  let i = 0;
  for (let val of searchResults.offers) {
    // if (i >= 10) break
    console.log(`${i++} = ` + val.requirementsCost)
  }

}
