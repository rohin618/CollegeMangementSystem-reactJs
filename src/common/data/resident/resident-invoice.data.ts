const statues = ['Paid', 'Pending', 'Partial'];

const generateRandomISODate = () => {
  const start = new Date(2023, 0, 1).getTime();
  const end = new Date(2025, 11, 31).getTime();
  const randomDate = new Date(start + Math.random() * (end - start));
  return randomDate.toISOString();
};

const getRandomItem = (arr:any) => arr[Math.floor(Math.random() * arr.length)];

const generateObjects = (count = 15) => {
  const result = [];

  for (let i = 1; i <= count; i++) {
    result.push({
      id: i,
      fromDate: generateRandomISODate(),
      toDate: generateRandomISODate(),
      status: getRandomItem(statues),
      invoiceNo: `IN-${1000 + i}`,
      fromResident: Math.floor(Math.random() * 10000),
      fromFund: Math.floor(Math.random() * 5000),
    });
  }

  return result;
};

export const residentInvoice = generateObjects();

