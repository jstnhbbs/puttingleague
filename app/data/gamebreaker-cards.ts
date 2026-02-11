/**
 * GameBreaker card data. Card images: /public/gamebreaker/card1.png through card29.png
 */
export interface GameBreakerCard {
  id: string
  title: string
  image: string
  description: string
}

export const gamebreakerCards: GameBreakerCard[] = [
  { id: '1', title: '2 for 1', image: '/gamebreaker/card1.png', description: 'Points are normal, but two putters must be in the air at the same time however you choose to do so with each attempt. Each attempt will count as 2 of your putts.' },
  { id: '2', title: 'ABOVE THE LAW', image: '/gamebreaker/card2.png', description: 'Remove the modifier for the "obstacle putt" for 3 putts during the station. Only applies to the station chosen by the wheel. NOT THE BONUS PUTT.' },
  { id: '3', title: 'ALL OR NOTHING', image: '/gamebreaker/card3.png', description: 'You can play this card before you start a station. You have one putt. If you make it, you get the equivalent of 9 makes on that station and are done. If you miss, you get a zero for the station.' },
  { id: '4', title: 'ASK ME ABOUT MY DARKHORSE', image: '/gamebreaker/card4.png', description: 'Choose one: You can scoober up to 3 putts for double points OR you can play ultimate frisbee defence for 3 of one opponent\'s putts. (Defence must avoid fouling the opponent, if the majority agrees a foul was committed then the putt is counted good.)' },
  { id: '5', title: 'BASKET SHRINK', image: '/gamebreaker/card5.png', description: 'Playing this card on an opponent makes them putt on the marksman basket instead of the standard one for 3 putts during any station except the bonus station.' },
  { id: '6', title: 'BLINDED', image: '/gamebreaker/card6.png', description: 'You must use this card before one of your stations. Your first 5 putts must be thrown blindfolded.' },
  { id: '7', title: 'BRODIESMITH21', image: '/gamebreaker/card7.png', description: 'Choose a station. Each putt at that station must be attempted in a different way. Some ideas: regular putt, straddle putt, horseshoe putt, lefty putt, turbo putt, scoober, forehand, skip shot, behind the back, between the legs, etc. You must play this card on yourself before the bonus round.' },
  { id: '8', title: 'CANCELED', image: '/gamebreaker/card8.png', description: 'Cancel any card just played on you. Cannot be used on post event cards such as the 10 bonus points.' },
  { id: '9', title: 'DUPLICATOR', image: '/gamebreaker/card9.png', description: '(Play before station) Make your final putt on this station and earn an additional putt. If the additional putt is made, one final free putt is earned.' },
  { id: '10', title: 'FOOT FAULT', image: '/gamebreaker/card10.png', description: 'This card allows you to jump putt or step putt from any station except the bonus station, or station 4 since it is already outside C1.' },
  { id: '11', title: 'GRAND THEFT', image: '/gamebreaker/card11.png', description: 'Steal a card from any player before they have used it, or announced their intention to use it during their round. This card is now yours, all uses and effects now apply to you.' },
  { id: '12', title: 'HECKLE', image: '/gamebreaker/card12.png', description: 'This card allows the player to heckle in any way not involving contact with the player, basket, or disc. It can be used twice, at any time without prior notice. After one use, paranoia will be on your side hehe.' },
  { id: '13', title: "I'll Take Those", image: '/gamebreaker/card13.png', description: 'Steal the last 5 putts thrown from an opponent to replace the first 5 putts for you at the same station. The player must rethrow the 5 putts as if they never happened.' },
  { id: '14', title: 'MEGA BASKET', image: '/gamebreaker/card14.png', description: 'This card allows the player to place the marksman basket next to the basket to increase the target area for 10 putts during any station except the bonus station. Any putt that lands in either basket will count.' },
  { id: '15', title: 'MIX IT UP', image: '/gamebreaker/card15.png', description: 'Play this card on an opponent to make them use 5 different putter molds for the entire station. No putter mold may be used more than twice.' },
  { id: '16', title: 'MONEYBALL', image: '/gamebreaker/card16.png', description: 'Play this card during any station to TRIPLE the value of just one putt.' },
  { id: '17', title: 'ON THE MOVE', image: '/gamebreaker/card17.png', description: 'Move 10 feet closer or farther away from the basket for your entire station. If you move closer, remove 1 point from each putt\'s worth and give up your bonus chance. If you move back double each putt\'s worth and keep your chance at the bonus.' },
  { id: '18', title: 'PASSIVE INCOME', image: '/gamebreaker/card18.png', description: 'This card can only be played before the 20 foot station begins for all players. Each putt missed adds 0.5 points to your total. Round up to nearest whole number.' },
  { id: '19', title: 'POT OF GOLD', image: '/gamebreaker/card19.png', description: 'If you hold this card at the end of the stream, add 10 points to your score.' },
  { id: '20', title: 'PUSH YOUR LUCK', image: '/gamebreaker/card20.png', description: 'You can use this card before starting a station. Each putt you make is worth triple, but once you miss, the entire station counts as zero. You can stop putting at any time. You are not required to throw all 10 putts.' },
  { id: '21', title: 'SECRET PACT', image: '/gamebreaker/card21.png', description: 'This card must be shown to at least one competitor witness, but can be played in secret on the intended target. Whether discovered or not, the next three putts thrown by the current putter also count for the person who played this card.' },
  { id: '22', title: 'SHRINKRAY', image: '/gamebreaker/card22.png', description: 'Play this on an opponent to force them to attempt their next 3 putts with a mini disc. The disc has to come to rest in the basket just as a normal putt, it cannot fall through the bottom.' },
  { id: '23', title: 'SIDE BET', image: '/gamebreaker/card23.png', description: 'Challenge an opponent before any putts are thrown at the start of the station. Whoever wins between you and the opponent you have challenged will receive double points for every putt they or you win by.' },
  { id: '24', title: 'SLOWPOKE', image: '/gamebreaker/card24.png', description: 'Play this card on an opponent to require to use only one putter at a time for the upcoming station, or remaining putts in the current station. They must use the same disc, and rebound for themselves.' },
  { id: '25', title: 'SNIPER', image: '/gamebreaker/card25.png', description: 'Play this card on an opponent before they begin a station. You may sit in Silas\'s chair within the boundaries of his desk and have 5 attempts to hit putts out of the air with your putters. You must hit the discs after leaving the hand of the player and before hitting basket.' },
  { id: '26', title: 'TAG-ALONG', image: '/gamebreaker/card26.png', description: 'Play this card on an opponent. Their next three putts will also count towards your point total.' },
  { id: '27', title: 'TAX COLLECTOR', image: '/gamebreaker/card27.png', description: 'If you hold this card at the end of the stream, you must attempt 10, 30 foot putts. Each putt you miss will subtract a point from your total.' },
  { id: '28', title: 'THE THIEF', image: '/gamebreaker/card28.png', description: 'This card allows you to steal 2 putts. Either one from two different opponents, or two from the same opponent. These putts can be added to your allocated putts for any station.' },
  { id: '29', title: 'UNEASY ALLIANCE', image: '/gamebreaker/card29.png', description: 'Choose another player before you both start a new station. The total points of each of your stations will be divided in half and split between you. If there is a half point, the larger amount goes to you.' },
]
