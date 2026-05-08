const residentStatusOptions = ['Living', 'RIP', 'Left from room'];  
const paymentStatusOptions = ['Paid', 'Pending', 'Partial'];

// Example Indian & global first names
const nameOptions = [
  'Rohan', 'Priya', 'Amit', 'Sneha', 'Kiran', 'Vikram', 'Anjali', 'Raj', 'Neha',
  'John', 'Alice', 'Sam', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Ethan', 'Sophia'
];

const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

const generateISODate = (startYear = 1940, endYear = 2025) => {
  const start = new Date(`${startYear}-01-01`).getTime();
  const end = new Date(`${endYear}-12-31`).getTime();
  return new Date(start + Math.random() * (end - start)).toISOString();
};

const generateResidents = (count = 15) => {
  const residents = [];

  for (let i = 0; i < count; i++) {
    const dob = generateISODate(1940, 1980);
    const admittedDate = generateISODate(1980, 2023);
    const dischangeDate = generateISODate(2024, 2026);
    const weekPayment = (Math.floor(Math.random() * 1000) + 500).toString(); // Between 500-1500

    residents.push({
      id:i,
      name: getRandomItem(nameOptions), // ✅ random realistic name
      dob,
      weekPayment,
      admittedDate,
      dischangeDate,
      pendingPayment: (Math.floor(Math.random() * 5000)).toString(),
      statusOfResident: getRandomItem(residentStatusOptions),
      paymentStatus: getRandomItem(paymentStatusOptions),
    });
  }

  return residents;
};

export const residentData = generateResidents();
