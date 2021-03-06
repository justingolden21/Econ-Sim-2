/* Notes:
if firm is otherwise ready to expand, they save money equal to expandReady

doesn't buy a resource it produces for expansion
	code is in check for "firm.hasExpand()" in doBuy() below
doesn't sell resource it produces equal to amount necessary for expansion
	code is in adjust() in Firm class in main.js

make sure they don't lose expandRequirement
could lose it if it's:
1. money they spend
2. good they sell
3. used in upkeep cost
*/

// note: [0] is just first item in purcahse costs before we shift array
// not always alias for PRICE

function buyResources(firm, purchaseCosts, resources, message) {
	// if(message=='expand') {
	// 	console.log(firm.type() );
	// 	console.log(firm.firmNum );
	// 	console.log(purchaseCosts);
	// 	console.log(resources);
	// }

	// buys as many of resources as possible
	for(resource in resources) {
		if(resource=='money')
			continue;

		// how much they need
		let amountToBuy = Math.max(resources[resource] - firm.inventory[resource], 0);
		if(amountToBuy==0)
			continue;

		if(!purchaseCosts[resource])
			continue;

		// let tmpAmount = 0;

		// loop through each seller of resource
		while(purchaseCosts[resource].length > 0) {

			amountToBuy = Math.max(resources[resource] - firm.inventory[resource], 0);

			let resourceInfo = purchaseCosts[resource][0];

			let resourceAvailable = resourceInfo[AVAILABLE];
			let moneyAvailable = Math.max(firm.inventory['money']-firm.moneyToSave, 0);
			let canAfford = Math.floor(moneyAvailable / resourceInfo[PRICE]);

			// min of how much firm needs, how much is available, and how much firm can afford
			let tmpAmountToBuy = Math.min(amountToBuy, resourceAvailable);
			tmpAmountToBuy = Math.min(tmpAmountToBuy, canAfford);

			// takes into account running out of money or not wanting any more
			if(tmpAmountToBuy == 0) {
				break;
			}

			// buy tmpAmountToBuy

			let seller = AIs[resourceInfo[FIRM_NUM] ];

			// if(message=='expand') {
				// params for this func, and args passed to doTrade
				// console.log(firm.str(), purchaseCosts, resources); // very fuckin useful console logs
				// console.log(seller.str(), firm.str(), resource, tmpAmountToBuy); // very fuckin useful console logs				
			// }

			// seller, buyer, resource, amount
			doTrade(seller, firm, resource, tmpAmountToBuy);
			
			// below line commented because we already (should) account for the resources we've aquired
			// resources[resource] -= tmpAmountToBuy; // update our parameter so we don't keep buying
			// console.log(firm.type(), 'tradin for them', resource);

			purchaseCosts[resource][0][AVAILABLE] -= tmpAmountToBuy;
			if(purchaseCosts[resource][0][AVAILABLE]==0) {
				purchaseCosts[resource].splice(0,1); // remove first elm
			}

			// tmpAmount += tmpAmountToBuy;

		} // end while

		// if(message=='expand')
			// console.log('Firm number', firm.firmNum, 'bought', tmpAmount, 'of', resource, 'to', message);

	} // end for
}

// new code below
const MAX_PRODUCE_BUY = 6;

function doBuy(firm, purchaseCosts) {
	// if(false) {
	if(!firm.hasUpkeep() ) {
		buyResources(firm, purchaseCosts, firm.upkeepCost, 'upkeep');
	}
	// if(false) {
	if(firm.hasExpand() ) {
		// console.log('tryin to expand a', firm.type() );

		// note: doesn't attempt to buy resource it produces
		let sellResource = Object.keys(firm.sell)[0];
		if(sellResource in firm.expandReady) {
			buyResources(firm, purchaseCosts, subtractAllFrom(sellResource, firm.expandReady), 'expand');
		}
		else {
			buyResources(firm, purchaseCosts, firm.expandReady, 'expand');
		}
		// return; //todo remove this

	}

	let inputs = Object.keys(firm.produceCost);
	// let input1 = Object.keys(firm.produceCost)[0];
	// let input2 = Object.keys(firm.produceCost)[1];

	// indexed by same index as inputs, ie. inputs[3] should correspond to inputProduceCosts[3]
	let inputProduceCosts = [];
	for(let i=0; i<inputs.length; i++) {
		// the firm's produce cost of that input
		inputProduceCosts[i] = firm.produceCost[inputs[i] ];
	}
	// let input1produceCost = firm.produceCost[input1];
	// let input2produceCost = firm.produceCost[input2];

	let inputPurchaseCosts = [];
	let nothingToPurchase = true;
	for(let i=0; i<inputs.length; i++) {
		inputPurchaseCosts[i] = purchaseCosts[inputs[i] ];
		if(purchaseCosts[inputs[i] ]) {
			nothingToPurchase = false;
		}
	}
	if(nothingToPurchase) {
		return;
	}
	// let input1purchaseCosts = purchaseCosts[input1];
	// let input2purchaseCosts = purchaseCosts[input2];

	// nothing to purchase
	// if(!input1purchaseCosts || !input2purchaseCosts) return;

	let inputsPurchased = [];
	for(let i=0; i<inputs.length; i++) {
		inputsPurchased[i] = 0;
	}
	// let input1purchased = 0;
	// let input2purchased = 0;

	// while(input1purchaseCosts.length > 0 && input2purchaseCosts.length > 0) {
	while(true) {
		let noneLeft = true;
		for(let i=0; i<inputs.length; i++) {
			if(inputPurchaseCosts[i].length==0) {
				noneLeft = false;
			}
		}
		if(noneLeft) {
			break;
		}

		let inputCosts = [];
		for(let i=0; i<inputs.length; i++) {
			inputCosts[i] = inputPurchaseCosts[i][0][PRICE];
		}
		// let input1cost = input1purchaseCosts[0][PRICE];
		// let input2cost = input2purchaseCosts[0][PRICE];

		let inputsAvailable = [];
		for(let i=0; i<inputs.length; i++) {
			inputsAvailable[i] = inputPurchaseCosts[i][0][AVAILABLE];
		}
		// let input1available = input1purchaseCosts[0][AVAILABLE];
		// let input2available = input2purchaseCosts[0][AVAILABLE];

		let costPerProduce = 0;
		for(let i=0; i<inputs.length; i++) {
			costPerProduce += inputPurchaseCosts[i] * inputCosts[i];
		}
		// let costPerProduce = input1produceCost * input1cost + input2produceCost * input2cost;


		// (same as before)
		// if don't have money to produce once
		let moneyAvailable = Math.max(firm.inventory['money']-firm.moneyToSave, 0);
		if(moneyAvailable < costPerProduce) {
			return;
		}

		// (same as before)
		// if not worth if to produce
		let sellPrice = firm.sell[Object.keys(firm.sell)[0] ];
		let amountProduced = Object.values(firm.producedGoods)[0];
		if(costPerProduce > 2*sellPrice*amountProduced) { // if losing more than 2x as much
			// return;
		}

		// (same as before)
		let amountCanProduce = Math.floor(moneyAvailable / costPerProduce);

		let sellerNums = [];
		let sellers = [];
		for(let i=0; i<inputs.length; i++) {
			sellerNums[i] = inputPurchaseCosts[i][0][FIRM_NUM];
			sellers[i] = AIs[sellerNums[i] ];
		}

		// let seller1Num = input1purchaseCosts[0][FIRM_NUM];
		// let seller1 = AIs[seller1Num]; // firm selling resource 1
		// let seller2Num = input2purchaseCosts[0][FIRM_NUM];
		// let seller2 = AIs[seller2Num]; // firm selling resource 2

		let inputsToBuy = [];
		for(let i=0; i<inputs.length; i++) {
			inputsToBuy[i] = amountCanProduce * inputProduceCosts[i];
			inputsToBuy[i] = Math.min(inputsToBuy[i], inputsAvailable[i]);
		}

		// let input1toBuy = amountCanProduce * input1produceCost;
		// let input2toBuy = amountCanProduce * input2produceCost;
		// input1toBuy = Math.min(input1toBuy, input1available);
		// input2toBuy = Math.min(input2toBuy, input2available);

		// --------------------------------

		// find limiting inputs on this iteration
		// let limitingInputs = [];
		// goal is to edit numbers of inputsToBuy to the limiting resource
		// first loop finds how much each input is limiting
		let amountCanProduceLimitedOfInput = [];
		for(let i=0; i<inputs.length; i++) {
			amountCanProduceLimitedOfInput[i] = Math.floor(inputsToBuy[i] / inputProduceCosts[i]);
		}
		// second loop finds the amount we can produce given all limitiations
		let minCanProduce = -1;
		for(let i=0; i<inputs.length; i++) {
			if(minCanProduce==-1 || amountCanProduceLimitedOfInput[i] < minCanProduce) {
				minCanProduce = amountCanProduceLimitedOfInput[i];
			}
		}
		// third loop sets inputsToBuy according to limitiations of other resources
		for(let i=0; i<inputs.length; i++) {
			inputsToBuy[i] = minCanProduce * inputProduceCosts[i];
		}

 
		// if(input1toBuy / input1produceCost > input2toBuy / input2produceCost) {
			// input 2 is limiting
			// let input1toBuy = input2toBuy / input2produceCost * input1produceCost;
		// } else if(input1toBuy / input1produceCost < input2toBuy / input2produceCost) {
			// input 1 limiting
			// let input2toBuy = input1toBuy / input1produceCost * input2produceCost;
		// }

		// --------------------------------

		for(let i=0; i<inputs.length; i++) {
			inputsToBuy[i] = Math.min(inputsToBuy[i], 
				(inputProduceCosts[i] * MAX_PRODUCE_BUY) - inputsPurchased[i]);
		}

		// limit amount to buy to max we should buy minus amount we already purchased
		// input1toBuy = Math.min(input1toBuy, 
		// 	(input1produceCost * MAX_PRODUCE_BUY) - input1purchased);
		// input2toBuy = Math.min(input2toBuy, 
		// 	(input2produceCost * MAX_PRODUCE_BUY) - input2purchased);

		// --------------------------------

		for(let i=0; i<inputs.length; i++) {
			doTrade(sellers[i], firm, inputs[i], inputsToBuy[i]);
		}

		// complete transaction
		// seller, buyer, resource, amount
		// doTrade(seller1, firm, input1, input1toBuy);
		// doTrade(seller2, firm, input2, input2toBuy);


		for(let i=0; i<inputs.length; i++) {
			purchaseCosts[inputs[i] ][0][AVAILABLE] -= inputsToBuy[i];
		}

		// don't need an index, instead just remove the empty elements
		// until we either don't want to buy or we ran out of elements
		// updates the object for next firm
		// purchaseCosts[input1][0][AVAILABLE] -= input1toBuy;
		// purchaseCosts[input2][0][AVAILABLE] -= input2toBuy;

		// --------------------------------

		let toBreak = true;
		for(let i=0; i<inputs.length; i++) {
			if(purchaseCosts[inputs[i] ][0][AVAILABLE]==0) {
				purchaseCosts[inputs[i] ].splice(0,1); // remove first elm
				toBreak = false;
				// note: don't break out of this for loop
				// need to keep updating purcahseCosts, removing empty elements
			}
		}


		// let toBreak = true;
		// if(purchaseCosts[input1][0][AVAILABLE]==0) {
		// 	purchaseCosts[input1].splice(0,1); // remove first elm
		// 	toBreak = false;
		// }
		// if(purchaseCosts[input2][0][AVAILABLE]==0) {
		// 	purchaseCosts[input2].splice(0,1); // remove first elm
		// 	toBreak = false;
		// }

		if(toBreak) {
			break;
		}


		toBreak = false;
		for(let i=0; i<inputs.length; i++) {
			inputsPurchased[i] += inputsToBuy[i];
			if(inputsPurchased[i] >= inputProduceCosts[i] * MAX_PRODUCE_BUY) {
				toBreak = true;
			}
		}
		if(toBreak) {
			break;
		}

		// input1purchased += input1toBuy;
		// input2purchased += input2toBuy;

		// if(input1purchased >= input1produceCost * MAX_PRODUCE_BUY) {
		// 	break;
		// }
		// if(input2purchased >= input2produceCost * MAX_PRODUCE_BUY) {
		// 	break;
		// }

	} // end while

}