# algo-wallet
Proof of Concept Cryptocurrency Trade Bot

Open 2 terminal window and navigate to project folder:
```
# Terminal 1
npm i
npm run dev

# Terminal 2
cd /client
npm i
npm start
```
- Click "Start the Trades!" at the top of the page.
- Order will begin to appear as sockets connect
- You may need to scroll down to see bids
- Red = bittrex orders
- Blue = poloniex orders
- Pink order = order amount updated
- Orange order = new order on book
- Background bar = Sum of the amount of orders up to that rate (sized relative to total sum)
