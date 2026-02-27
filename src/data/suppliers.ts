export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTime: number; // days
}

export const suppliers: Supplier[] = [
  {
    id: "SUP-001",
    companyName: "Fresh Farms Ltd.",
    contactPerson: "Kamal Perera",
    email: "kamal@freshfarms.lk",
    phone: "0112 345 678",
    leadTime: 2,
  },
  {
    id: "SUP-002",
    companyName: "Ceylon Dairy Co.",
    contactPerson: "Nimasha Fernando",
    email: "nimasha@ceylondairy.lk",
    phone: "0117 891 234",
    leadTime: 1,
  },
  {
    id: "SUP-003",
    companyName: "Island Beverages PLC",
    contactPerson: "Rajan Sooriyaarachchi",
    email: "rajan@islandbev.lk",
    phone: "0113 456 789",
    leadTime: 3,
  },
  {
    id: "SUP-004",
    companyName: "Golden Bakery Supplies",
    contactPerson: "Thilani Wickrama",
    email: "thilani@goldenbakery.lk",
    phone: "0114 567 890",
    leadTime: 1,
  },
  {
    id: "SUP-005",
    companyName: "Tropical Harvest Exporters",
    contactPerson: "Asanka Bandara",
    email: "asanka@tropicalharvest.lk",
    phone: "0115 678 901",
    leadTime: 5,
  },
];
