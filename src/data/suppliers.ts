export interface Supplier {
  id: number;
  supplierCode?: string | null;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  leadTime: number; // days
  isAutoReorderEnabled: boolean;
  isActive: boolean;
  createdAt?: string;
}

export const suppliers: Supplier[] = [
  {
    id: 1,
    supplierCode: "SI0001",
    companyName: "Fresh Farms Ltd.",
    contactPerson: "Kamal Perera",
    email: "kamal@freshfarms.lk",
    phone: "0112 345 678",
    leadTime: 2,
    isAutoReorderEnabled: true,
    isActive: true,
  },
  {
    id: 2,
    supplierCode: "SI0002",
    companyName: "Ceylon Dairy Co.",
    contactPerson: "Nimasha Fernando",
    email: "nimasha@ceylondairy.lk",
    phone: "0117 891 234",
    leadTime: 1,
    isAutoReorderEnabled: true,
    isActive: true,
  },
  {
    id: 3,
    supplierCode: "SI0003",
    companyName: "Island Beverages PLC",
    contactPerson: "Rajan Sooriyaarachchi",
    email: "rajan@islandbev.lk",
    phone: "0113 456 789",
    leadTime: 3,
    isAutoReorderEnabled: false,
    isActive: true,
  },
  {
    id: 4,
    supplierCode: "SI0004",
    companyName: "Golden Bakery Supplies",
    contactPerson: "Thilani Wickrama",
    email: "thilani@goldenbakery.lk",
    phone: "0114 567 890",
    leadTime: 1,
    isAutoReorderEnabled: false,
    isActive: true,
  },
  {
    id: 5,
    supplierCode: "SI0005",
    companyName: "Tropical Harvest Exporters",
    contactPerson: "Asanka Bandara",
    email: "asanka@tropicalharvest.lk",
    phone: "0115 678 901",
    leadTime: 5,
    isAutoReorderEnabled: true,
    isActive: true,
  },
];
