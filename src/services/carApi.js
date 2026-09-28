import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

export const carHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const USER_CARS_API = '/api/user/cars';

// 백엔드 /api/user/cars/v3 는 한글 '수입'/'국산'을 인식하지 못하고 영어 코드(import/domestic)만
// 수입/국산으로 처리한다. (한글 '수입'을 보내면 국산 분기로 빠져 수입차 목록이 빈다.)
// 따라서 차량 원산지 값은 항상 영어 코드로 정규화해서 보낸다. (소형/SUV 등 차종 값은 그대로 통과)
const ORIGIN_CAR_TYPE = {
  수입: 'import',
  imported: 'import',
  import: 'import',
  국산: 'domestic',
  domestic: 'domestic',
};

const normalizeCarType = (carType) => {
  if (carType == null || carType === '') return carType;
  return ORIGIN_CAR_TYPE[String(carType).trim()] ?? carType;
};

export const carAPI = {
  getBrands: async (country = null) => {
    const params = country ? { country } : {};
    const { data } = await carHttp.get(`${USER_CARS_API}/brands`, { params });
    return data ?? [];
  },

  getVehicleLines: async (brandId) => {
    if (!brandId) {
      return [];
    }
    const { data } = await carHttp.get(`${USER_CARS_API}/vehicle-lines`, { params: { brandId } });
    return data ?? [];
  },

  getModels: async (vehicleLineId) => {
    if (!vehicleLineId) {
      return [];
    }
    const { data } = await carHttp.get(`${USER_CARS_API}/models`, { params: { vehicleLineId } });
    return data ?? [];
  },

  getTrimsByModel: async (modelId) => {
    if (!modelId) {
      return [];
    }
    const { data } = await carHttp.get(`${USER_CARS_API}/trims`, { params: { modelId } });
    return data ?? [];
  },

  searchTrims: async ({ keyword, limit = 10 }) => {
    const { data } = await carHttp.get(`${USER_CARS_API}/search`, {
      params: {
        keyword,
        limit,
      },
    });
    return data ?? { items: [] };
  },

  findTrims: async ({
    brandId,
    modelId,
    carType,
    vehicleType,
    fuel,
    minPrice,
    maxPrice,
    keyword,
    page = 1,
    limit = 12,
    sort = 'popular',
    direction,
  } = {}) => {
    const { data } = await carHttp.get(USER_CARS_API, {
      params: {
        brandId,
        modelId,
        carType: normalizeCarType(carType),
        vehicleType,
        fuel,
        minPrice,
        maxPrice,
        keyword,
        page,
        limit,
        sort,
        direction,
      },
    });
    return {
      items: data?.items ?? [],
      pagination: data?.pagination ?? null,
    };
  },

  // v2 차량 목록 조회 API (백엔드 /api/user/cars/v2)
  findTrimsV2: async ({
    brandId,
    modelId,
    carType,
    vehicleType,
    fuel,
    minPrice,
    maxPrice,
    keyword,
    page = 1,
    limit = 12,
    sort = 'popular',
    direction,
  } = {}) => {
    const { data } = await carHttp.get(`${USER_CARS_API}/v2`, {
      params: {
        brandId,
        modelId,
        carType: normalizeCarType(carType),
        vehicleType,
        fuel,
        minPrice,
        maxPrice,
        keyword,
        page,
        limit,
        sort,
        direction,
      },
    });
    return {
      items: data?.items ?? [],
      pagination: data?.pagination ?? null,
    };
  },

  // v3 차량 목록 조회 API (백엔드 /api/user/cars/v3)
  findTrimsV3: async ({
    brandId,
    modelId,
    carType,
    vehicleType,
    fuel,
    minPrice,
    maxPrice,
    keyword,
    page = 1,
    limit = 12,
    sort = 'percent_desc',
    direction,
  } = {}) => {
    const { data } = await carHttp.get(`${USER_CARS_API}/v3`, {
      params: {
        brandId,
        modelId,
        carType: normalizeCarType(carType),
        vehicleType,
        fuel,
        minPrice,
        maxPrice,
        keyword,
        page,
        limit,
        sort,
        direction,
      },
    });
    return {
      items: data?.items ?? [],
      pagination: data?.pagination ?? null,
    };
  },

  getCarDetail: async (trimId) => {
    if (!trimId) {
      throw new Error('trimId is required');
    }
    const { data } = await carHttp.get(`${USER_CARS_API}/${trimId}/detail`);
    return data;
  },
};

export default carAPI;
