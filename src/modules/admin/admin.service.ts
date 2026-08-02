import { prisma } from "../../lib/prisma.js";
import { buildFilterCondition } from "../../utils/filter.js";
import { calculatePagination, getPagination } from "../../utils/pagination.js";
import { buildSearchCondition } from "../../utils/search.js";
import {
  bookingFilterableFields,
  bookingSearchableFields,
  categoryFilterableFields,
  categorySearchableFields,
  userFilterableFields,
  userSearchableFields,
} from "./admin.constant.js";
import { ICategory, IgetBooking, IgetCategory, Igetuser, TUpdateCategory } from "./admin.interface.js";
import { UserStatus } from "@prisma/client";
import httpStatus from "http-status";
import AppError from "../../errors/AppErrors.js";
import { Prisma } from "@prisma/client";

const getAllUsers = async (query : Igetuser) =>{

    const { searchTerm, ...rest } = query;

    // Restrict filters to only fields the layer knows how to translate.
    // Anything else (page, limit, sortBy, …) is handled separately by
    // `getPagination` and would otherwise throw "missing fields" if it ever
    // reached Prisma via `buildFilterCondition`.
    const filters: Record<string, unknown> = {};
    for (const key of userFilterableFields) {
        if (key in rest && (rest as any)[key] !== undefined && (rest as any)[key] !== "") {
            filters[key] = (rest as any)[key];
        }
    }

    const {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    } = getPagination(query);

    const andConditions = buildFilterCondition(
        filters, userFilterableFields
    );

    const orCondition = buildSearchCondition(
        searchTerm, userSearchableFields
    );

    const users = await prisma.user.findMany({

        where :{
            AND: [
                ...andConditions,
                orCondition
            ]
        },
        include :{
            technicianProfile :true,
        },
        omit :{
            password : true,
        },

        skip,
        take: limit,
        orderBy: {
            [sortBy] : sortOrder,
        }        

    });

    const total =await prisma.user.count({
          where :{
            AND: [
                ...andConditions,
                orCondition
            ]
        }
    })

    return {
    meta: {
      page,
      limit,
      total,
    },

    data: users,
  };

}

const updateUserStatus = async (
    id :string,
    status : UserStatus
) =>{

    const user = await prisma.user.findUnique({
        where :{id}
    });

    if(!user){
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role === "ADMIN") {
        throw new AppError(
        httpStatus.BAD_REQUEST,
        "Admin status cannot be changed"
        );
    }

    const updateUser = await prisma.user.update({
        where :{id},
        data :{
            status,
        },
        include:{
            technicianProfile:true
        },
        omit :{
            password:true
        }
    });

    return updateUser;
}

const createCategory = async (payload :ICategory) =>{
    
    const existingCategory = await prisma.category.findUnique({
        where :{
            name : payload.name
        }
    });

    if(existingCategory){
        throw new AppError(httpStatus.CONFLICT,"Category already exists");
    }

    const category = await prisma.category.create({
      data: payload,
    });

    return category;
}

const getAllCategories = async ( query :IgetCategory) =>{

    const {searchTerm , isActive,...filters }= query;


    const {
        page,
        limit,
        sortBy,
        sortOrder,
        skip,
    } = getPagination(query);

    const andConditions = buildFilterCondition(filters,categoryFilterableFields);
    const orCondition = buildSearchCondition (searchTerm,categorySearchableFields);
    if (typeof isActive === "string") {
        andConditions.push({
            isActive: isActive === "true",
        });
        } else if (typeof isActive === "boolean") {
        andConditions.push({
            isActive,
        });
    }

    const categories = await prisma.category.findMany({
        where:{
            AND :[
                ... andConditions,
                orCondition
            ]
        },

        skip,
        take : limit,
        orderBy : {
            [sortBy]:sortOrder,
        }
    });

    const total = await prisma.category.count({
        where :{
            AND :[
                ...andConditions,
                orCondition
            ]
        }
    });

    return {
      meta: {
        page,
        limit,
        total,
     },

     data: categories,
   };


}

const updateCategory = async (id: string, payload: TUpdateCategory
) => {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND,"Category not found.");
  }

  if (payload.name) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: payload.name,
          mode: "insensitive",
        },
        NOT: {
          id,
        },
      },
    });

    if (existingCategory) {
        throw new AppError( httpStatus.BAD_REQUEST, "Category name already exists." );
    }
  }

  const result = await prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const getAllBookings = async (query: IgetBooking) => {
  const { searchTerm, ...filters } = query;

  const { page, limit, skip, sortBy, sortOrder } = getPagination(query);

  const andConditions = buildFilterCondition(filters, bookingFilterableFields);
  const orCondition = buildSearchCondition(searchTerm, bookingSearchableFields);

  const bookings = await prisma.booking.findMany({
    where: {
      AND: [...andConditions, orCondition],
    },
    include: {
      customer: {
        select: { id: true, name: true, email: true, profileImage: true },
      },
      technician: {
        select: {
          id: true,
          user: {
            select: { id: true, name: true, email: true, profileImage: true },
          },
        },
      },
      service: {
        select: { id: true, title: true, categoryId: true },
      },
      payment: {
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          paidAt: true,
        },
      },
    },
    skip,
    take: limit,
    orderBy: {
      [sortBy]: sortOrder,
    },
  });

  const total = await prisma.booking.count({
    where: {
      AND: [...andConditions, orCondition],
    },
  });

  return {
    meta: { page, limit, total },
    data: bookings,
  };
};

const getDashboardStats = async () => {
  // -------- Users --------
  const [userTotal, customers, technicians, admins, activeUsers, blockedUsers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.user.count({ where: { role: "TECHNICIAN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "BLOCKED" } }),
    ]);

  // -------- Bookings (status breakdown) --------
  const bookingStatusGroups = await prisma.booking.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const bookingTotal = bookingStatusGroups.reduce(
    (acc, g) => acc + g._count._all,
    0
  );

  const bookingsByStatus = bookingStatusGroups.reduce<
    Record<string, number>
  >((acc, g) => {
    acc[g.status] = g._count._all;
    return acc;
  }, {});

  // -------- Categories + services --------
  const [categoryTotal, serviceTotal] = await Promise.all([
    prisma.category.count(),
    prisma.service.count(),
  ]);

  // -------- Reviews --------
  const reviewTotal = await prisma.review.count();

  // -------- Revenue --------
  const allPayments = await prisma.payment.findMany({
    where: { status: "SUCCEEDED" },
    select: { amount: true, paidAt: true },
  });

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let totalRevenue = 0;
  let thisMonthRevenue = 0;
  let lastMonthRevenue = 0;

  for (const p of allPayments) {
    const amt = Number(p.amount);
    if (!Number.isFinite(amt)) continue;
    totalRevenue += amt;
    if (p.paidAt) {
      if (p.paidAt >= startOfThisMonth) thisMonthRevenue += amt;
      else if (p.paidAt >= startOfLastMonth && p.paidAt < startOfThisMonth)
        lastMonthRevenue += amt;
    }
  }

  // -------- Top categories (bookings grouped by service.categoryId) --------
  const topCategoryGroups = await prisma.booking.groupBy({
    by: ["serviceId"],
    _count: { _all: true },
    orderBy: { _count: { serviceId: "desc" } },
    take: 5,
  });

  const serviceIds = topCategoryGroups.map((g) => g.serviceId);

  const services = serviceIds.length
    ? await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: {
          id: true,
          title: true,
          category: { select: { id: true, name: true } },
        },
      })
    : [];

  const serviceMap = new Map(services.map((s) => [s.id, s]));

  const topCategories = topCategoryGroups.map((g) => {
    const s = serviceMap.get(g.serviceId);
    return {
      categoryId: s?.category?.id ?? null,
      categoryName: s?.category?.name ?? "Uncategorized",
      bookingsCount: g._count._all,
    };
  });

  // -------- Recent bookings (5) --------
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: { select: { id: true, title: true } },
      payment: { select: { id: true, status: true, amount: true } },
    },
  });

  // -------- Recent users (5) --------
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileImage: true,
      createdAt: true,
    },
  });

  return {
    users: {
      total: userTotal,
      customers,
      technicians,
      admins,
      active: activeUsers,
      blocked: blockedUsers,
    },
    bookings: {
      total: bookingTotal,
      byStatus: bookingsByStatus,
    },
    catalog: {
      categories: categoryTotal,
      services: serviceTotal,
      reviews: reviewTotal,
    },
    revenue: {
      total: Number(totalRevenue.toFixed(2)),
      thisMonth: Number(thisMonthRevenue.toFixed(2)),
      lastMonth: Number(lastMonthRevenue.toFixed(2)),
      currency: "USD",
    },
    topCategories,
    recentBookings,
    recentUsers,
  };
};




export const AdminService = {
  getAllUsers,
  updateUserStatus,
  createCategory,
  getAllCategories,
  updateCategory,
  getAllBookings,
  getDashboardStats,
};