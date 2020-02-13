import { prompt } from 'inquirer';
import { ParsedArgs } from 'minimist';
import ora from 'ora';
import { shuffle } from 'lodash';

import { buyOnMarket, searchMarket } from '../market';
import { sellToTrader } from '../traders';
import { SortType, SortDirection, CurrencyType, OwnerType } from '../types/market';
import { ensureAuthenticated } from '../utils';
import { getLocale } from '../static';
import { InvetoryItem } from '../types/profile';
import { TRADERS, ITEMS } from '../constants';
import { getMainProfile } from '../profile';

let profitTotal = 0;

const categories = [
  {
    name: 'SMGs',
    value: {
      name: 'SMGs',
      id: '5b5f796a86f774093f2ed3c0',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Shotguns',
    value: {
      name: 'Shotguns',
      id: '5b5f794b86f77409407a7f92',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Pistols',
    value: {
      name: 'Pistols',
      id: '5b5f792486f77447ed5636b3',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Marksman rifles',
    value: {
      name: 'Marksman rifles',
      id: '5b5f791486f774093f2ed3be',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Bolt-action rifles',
    value: {
      name: 'Bolt-action rifles',
      id: '5b5f798886f77447ed5636b5',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Machine guns',
    value: {
      name: 'Machine guns',
      id: '5b5f79a486f77409407a7f94',
      trader: TRADERS.mechanic,
    },
  },
  {
    name: 'Assault carbines',
    value: {
      name: 'Assault carbines',
      id: '5b5f78e986f77447ed5636b1',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Assault rifles',
    value: {
      name: 'Assault rifles',
      id: '5b5f78fc86f77409407a7f90',
      trader: TRADERS.mechanic,
    },
    checked: true,
  },
  {
    name: 'Flammable materials',
    value: {
      name: 'Flammable materials',
      id: '5b47574386f77428ca22b2f2',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Barter items',
    value: {
      name: 'Barter items',
      id: '5b47574386f77428ca22b33e',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Tools',
    value: {
      name: 'Tools',
      id: '5b47574386f77428ca22b2f6',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Valuables',
    value: {
      name: 'Valuables',
      id: '5b47574386f77428ca22b2f1',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Electronics',
    value: {
      name: 'Electronics',
      id: '5b47574386f77428ca22b2ef',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Household materials',
    value: {
      name: 'Household materials',
      id: '5b47574386f77428ca22b2f0',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Keys',
    value: {
      name: 'Keys',
      id: '5b47574386f77428ca22b342',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Injectors',
    value: {
      name: 'Injectors',
      id: '5b47574386f77428ca22b33a',
      trader: TRADERS.therapist,
    },
  },
  {
    name: 'Weapon parts & mods',
    value: {
      name: 'Weapon parts & mods',
      id: '5b5f71a686f77447ed5636ab',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Suppressors',
    value: {
      name: 'Suppressors',
      id: '5b5f731a86f774093e6cb4f9',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Barrels',
    value: {
      name: 'Barrels',
      id: '5b5f75c686f774094242f19f',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Sights',
    value: {
      name: 'Sights',
      id: '5b5f73ec86f774093e6cb4fd',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Muzzle adapters',
    value: {
      name: 'Muzzle adapters',
      id: '5b5f72f786f77447ec5d7702',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Mounts',
    value: {
      name: 'Mounts',
      id: '5b5f755f86f77447ec5d770e',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Receivers & slides',
    value: {
      name: 'Receivers & slides',
      id: '5b5f764186f77447ec5d7714',
      trader: TRADERS.skier,
    },
  },
  {
    name: 'Ammo',
    value: {
      name: 'Ammo',
      id: '5b47574386f77428ca22b346',
      trader: TRADERS.mechanic,
    },
  },
];

export default async function auto(argv: ParsedArgs) {
  await ensureAuthenticated();
  const locale = await getLocale();
  let count = 0;

  const userInput = await prompt([{
    type: 'checkbox',
    name: 'categories',
    message: 'Select categories to query:',
    choices: categories,
    validate: function(answer) {
      return answer.length > 0 || 'You must choose at least one category';
    }
  }, {
    type: 'number',
    name: 'minimumProfit',
    message: 'Minimum profit to auto buy? (0 = always)',
    default: 2000,
    validate: function(answer) {
      if (isNaN(answer)) return 'Must be a number';

      return answer >= 0 || 'Profit must be at least 0';
    }
  }, {
    type: 'number',
    name: 'maximumProfit',
    message: 'Maximum profit to auto sell? (0 = always)',
    default: 100000,
    validate: function(answer) {
      if (isNaN(answer)) return 'Must be a number';

      return answer >= 0 || 'Profit must be at least 0';
    }
  }]);

  return (async function loop(): Promise<void> {
    await shuffle(userInput.categories).reduce((p1, category) => p1.then(async () => {
      await [1,2].reduce((p2, page) => p2.then(async () => {
        const searchingSpinner = ora(`Searching ${category.name} (${page === 1 ? 'Cheapest' : 'Newest'})`).start();
        const searchResults = await searchMarket({
          page: 1,
          limit: 100,
          sortType: page === 1 ? SortType.Price : SortType.Expiration,
          sortDirection: page === 1 ? SortDirection.ASC : SortDirection.DESC,
          currency: CurrencyType.Rouble,
          removeBartering: true,
          offerOwnerType: OwnerType.Player,
          handbookId: category.id,
        });
        searchingSpinner.succeed();
        ora(`Found ${searchResults.offers.length} results`).succeed();

        const checkingSpinner = ora('Checking for deals').start();
        const mappedResults = searchResults.offers
          .map((offer) => ({
            id: offer._id,
            raw: offer,
            worth: Math.floor(offer.itemsCost * category.trader.multiplier),
            profit: Math.floor((offer.itemsCost * category.trader.multiplier) - offer.requirementsCost),
          }))
          .filter((offer) => offer.profit > userInput.minimumProfit)
          .sort((a, b) => b.profit - a.profit);

        if (!mappedResults.length) {
          checkingSpinner.fail();
          ora('No deals found').fail();
          return;
        }

        checkingSpinner.succeed();
        ora(`${mappedResults.length} deals found`).succeed();

        await mappedResults.reduce((p3, offer) => p3.then(async () => {
          const buyingSpinner = ora(`Buying ${locale.templates[offer.raw.items[0]._tpl].Name} for ${offer.raw.requirementsCost}, worth ${offer.worth}`).start();
          let buyResponse: {
            items: {
              new: InvetoryItem[];
            }
          };

          try {
            buyResponse = await buyOnMarket(offer.raw);
            buyingSpinner.succeed();
          } catch (error) {
            buyingSpinner.fail();
            ora(error.message).fail();
            return;
          }

          if (offer.profit > userInput.maximumProfit) {
            ora(`Profit exceeds ${userInput.maximumProfit}, skipping auto sell`).succeed();
            profitTotal += offer.profit;
            return;
          }

          const sellingSpinner = ora(`Selling ${locale.templates[offer.raw.items[0]._tpl].Name} for ${offer.worth} (${offer.profit} Profit)`).start();
          try {
            const purchasedItem = buyResponse.items.new.find((item) => item._tpl === offer.raw.items[0]._tpl);
            await sellToTrader(category.trader.id, purchasedItem._id);
            sellingSpinner.succeed();

            profitTotal += offer.profit;
            ora(`${profitTotal} total profit this session`).succeed();
            console.log('=============================================')
          } catch (error) {
            sellingSpinner.fail();
            ora(error.message).fail();
          }
        }), Promise.resolve());
        await sleep(5000);
        let balance = 0;
        let profile = await getMainProfile();

        const moneyStack = profile.Inventory.items.filter(item => item._tpl == ITEMS.roubles);
        for(let val of moneyStack) {
          balance += val.upd.StackObjectsCount
        }
        ora('balance = ' + balance).succeed();
      }), Promise.resolve());
      await sleep(5000);
    }), Promise.resolve());
    await sleep(30000);
    
    if (count >= 100) {
      ora('sleep').fail();
      await sleep(60*60*1000);
      count = 0;
    } else count++;
    ora('count = ' + count).warn();

    return loop();
  })();
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
} 