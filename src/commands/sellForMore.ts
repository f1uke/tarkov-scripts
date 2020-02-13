import { ParsedArgs } from 'minimist';
import { ensureAuthenticated } from '../utils';
import { getMainProfile } from '../profile';
import { searchMarket, buyOnMarket, sellOnMarket } from '../market';
import { SortType, SortDirection, CurrencyType, OwnerType } from '../types/market';
import ora = require('ora');

const targetItem = {
  name: 'TerraGroup Labs access keycard',
  id: '5c94bbff86f7747ee735c08f',
};
const buyBelowPrice = 150000;
const sellAtPrice = 160000;
const amountBeforeSell = 10;

/*
Warning: I wrote this after I got banned so I'm unable to test if this works, use at your own risk
*/

export default async function sellForMore(argv: ParsedArgs) {
  await ensureAuthenticated();

  return (async function loop(): Promise<void> {
    const profile = await getMainProfile();

    // Check if Offer slots are full
    if (profile.RagfairInfo.offers.length >= 3) {
      console.log('Offer slots full');
      return;
    }

    const targetItemsInInventory = profile.Inventory.items
      .filter((item) => item._tpl === targetItem.id)
      .map((item) => item._id);

    // Check if targetItem in stash exceed amountBeforeSell
    if (targetItemsInInventory.length > amountBeforeSell) {
      // If so, sell them on the market
      try {
        await sellOnMarket(targetItemsInInventory, sellAtPrice);
      } catch (error) {
        console.log('Failed to offer item', error);
      }

    } else {
      // If not buy more
      const searchResults = await searchMarket({
        page: 1,
        limit: 100,
        sortType: SortType.Price,
        sortDirection: SortDirection.ASC,
        currency: CurrencyType.Rouble,
        removeBartering: true,
        offerOwnerType: OwnerType.Player,
        handbookId: targetItem.id,
      });

      console.log(searchResults.offers[0].requirementsCost)
      const filteredResults = searchResults.offers
        .filter((offer) => offer.requirementsCost < buyBelowPrice);

      if (!filteredResults.length) {
        ora('Nothing found').warn();
        return loop();
      }

      console.log(`Found ${filteredResults.length}`);

      await filteredResults.reduce((p, offer) => p.then(async () => {
        try {
          await buyOnMarket(offer);

          ora('Buy successful').succeed();
        } catch (error) {
          ora('Buy failed').fail();
        }
      }), Promise.resolve());
    }
    return loop();
  })();
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 