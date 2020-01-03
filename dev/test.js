const Blockchain = require('./blockchain');


const Bitcoin = new Blockchain()

// Bitcoin.createNewBlock(2389 , '78asddf54asdtha444yhyasd' , '8ghyy4hy849hayhsda321afsasaf');
// Bitcoin.createNewBlock(254, "78asddfaabh4gh6fs684sa4asd44a86a", "8gy9849fdgda9agaf58iyf");
// Bitcoin.createNewBlock(923, "78asd4154asagcsb444asd", "8gy12384baada36agsqtda3z");

// Bitcoin.createNewTransaction(5 , 'ali8dafasfafas24qw8g8' , 'posakoyaujtig84hgfadd')
//  const previousBlockHash = '6qqwqdafdasf1qwg84yh6gh4sh8tsdg61fg';

//  const currentData = [
//    {
//      amount: 100,
//      sender: "adda",
//      recipient: "dsawd"
//    },
//    {
//      amount: 210,
//      sender: "vyetgg",
//      recipient: "dasw2"
//    },
//    {
//      amount: 11,
//      sender: "ad3",
//      recipient: "fasfyu"
//    }
//  ];

// const nonce =  Bitcoin.proofOfWork(previousBlockHash,currentData)

const bc1 = {
  chain: [
    {
      index: 1,
      timestamp: 1566662246163,
      transactions: [],
      nonce: 100,
      hash: "0",
      previousBlockHash: "0"
    },
    {
      index: 2,
      timestamp: 1566662501609,
      transactions: [],
      nonce: 18140,
      hash: "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
      previousBlockHash: "0"
    },
    {
      index: 3,
      timestamp: 1566664618600,
      transactions: [
        {
          amount: 12.5,
          sender: "00",
          recipient: "d43f65c0c68711e9be84f39ca3ba2e1a",
          transactionId: "766c9430c68811e9be84f39ca3ba2e1a"
        }
      ],
      nonce: 114867,
      hash: "000048e3148d464be8712ae460494bf24f549267a12cc8d0691b6e413331a2f3",
      previousBlockHash:
        "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
    }
  ],
  pendingTransactions: [
    {
      amount: 12.5,
      sender: "00",
      recipient: "de28ef20c68711e9818db3b459280e9c",
      transactionId: "6444f540c68d11e9818db3b459280e9c"
    }
  ],
  currentNodeUrl: "http://localhost:3003",
  networkNodes: [
    "http://localhost:3002",
    "http://localhost:3001",
    "http://localhost:3004",
    "http://localhost:3005"
  ]
}; 

// Bitcoin.hashBlock(previousBlockHash , currentData , 845464)

// console.log(Bitcoin.hashBlock(previousBlockHash, currentData, 845464));

console.log(Bitcoin.chainIsValid(bc1.chain));


