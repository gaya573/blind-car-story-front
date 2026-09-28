import { keepPreviousData, useQuery, useQueries, useInfiniteQuery } from '@tanstack/react-query';
import { carAPI } from '../../services/carApi';

const staleTime = 1000 * 60 * 5;

// 브랜드 목록 조회
// - 기본적으로는 country 필터를 기준으로 조회
// - 두 번째 인자로 options({ enabled 등 })를 넘겨서, 특정 화면(domestic carlist 등)에서
//   네트워크 호출을 끌 수 있도록 한다.
export const useCarBrandsQuery = (country = null, options = {}) =>
  useQuery({
    queryKey: ['cars', 'brands', country],
    queryFn: () => carAPI.getBrands(country),
    staleTime,
    ...options,
  });

export const useCarFilterQueries = (brandId, vehicleLineId) =>
  useQueries({
    queries: [
      {
        queryKey: ['cars', 'vehicle-lines', { brandId }],
        queryFn: () => carAPI.getVehicleLines(brandId),
        enabled: Boolean(brandId),
        staleTime,
      },
      {
        queryKey: ['cars', 'models', { vehicleLineId }],
        queryFn: () => carAPI.getModels(vehicleLineId),
        enabled: Boolean(vehicleLineId),
        staleTime,
      },
    ],
  });

export const useCarListQuery = (params) =>
  useQuery({
    queryKey: ['cars', 'list', params],
    queryFn: () => carAPI.findTrims(params),
    keepPreviousData: true,
  });

export const useCarListInfiniteQuery = (params) => {
  const { page, limit, ...otherParams } = params;
  
  return useInfiniteQuery({
    queryKey: ['cars', 'list', 'infinite', otherParams],
    queryFn: ({ pageParam = 1 }) => 
      carAPI.findTrims({ ...otherParams, page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      if (pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    staleTime: staleTime,
  });
};

// v2 차량 목록 조회 (일반)
export const useCarListQueryV2 = (params) =>
  useQuery({
    queryKey: ['cars', 'list', 'v2', params],
    queryFn: () => carAPI.findTrimsV2(params),
    keepPreviousData: true,
  });

// v2 차량 목록 조회 (무한 스크롤)
export const useCarListInfiniteQueryV2 = (params) => {
  const { page, limit, ...otherParams } = params;

  return useInfiniteQuery({
    queryKey: ['cars', 'list', 'infinite', 'v2', otherParams],
    queryFn: ({ pageParam = 1 }) =>
      carAPI.findTrimsV2({ ...otherParams, page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      if (pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    staleTime: staleTime,
  });
};

// v3 차량 목록 조회 (무한 스크롤)
export const useCarListInfiniteQueryV3 = (params) => {
  const { page, limit, ...otherParams } = params;

  return useInfiniteQuery({
    queryKey: ['cars', 'list', 'infinite', 'v3', otherParams],
    queryFn: ({ pageParam = 1 }) =>
      carAPI.findTrimsV3({ ...otherParams, page: pageParam, limit }),
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.pagination;
      if (!pagination) return undefined;
      if (pagination.page < pagination.totalPages) {
        return pagination.page + 1;
      }
      return undefined;
    },
    staleTime: staleTime,
  });
};

export const useCarDetailQuery = (trimId) =>
  useQuery({
    queryKey: ['cars', 'detail', trimId],
    queryFn: () => carAPI.getCarDetail(trimId),
    enabled: Boolean(trimId),
    placeholderData: keepPreviousData,
    staleTime,
  });

export const useCarSearchQuery = (keyword, { enabled = true, limit } = {}) =>
  useQuery({
    queryKey: ['cars', 'search', { keyword, limit }],
    queryFn: () => carAPI.searchTrims({ keyword, limit }),
    enabled: Boolean(keyword) && enabled,
  });
