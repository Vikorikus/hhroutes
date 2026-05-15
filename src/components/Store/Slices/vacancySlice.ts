import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Vacancy } from "../../../Types/vacancy";
import { mockVacanciesResponse } from "../../../mockData";

interface FetchVacanciesArgs {
  text: string;
  page: number;
  area?: string;
  skill_set?: string[];
}

interface VacancyState {
  list: Vacancy[];
  loading: boolean;
  error: string | null;
  found: number;
  page: number;
  pages: number;
  perPage: number;
}

const initialState: VacancyState = {
  list: [],
  loading: false,
  error: null,
  found: 0,
  page: 0,
  pages: 0,
  perPage: 10,
};

export const fetchVacancies = createAsyncThunk(
  "vacancies/fetchAll",
  async (arg: FetchVacanciesArgs, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      let filteredItems = [...mockVacanciesResponse.items];

      if (arg.text) {
        const query = arg.text.toLowerCase().trim();
        filteredItems = filteredItems.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.employer?.name.toLowerCase().includes(query),
        );
      }

      if (arg.area) {
        filteredItems = filteredItems.filter((v) => {
          const cityName = v.area?.name?.trim();
          if (arg.area === "1" || arg.area === "moscow") {
            return cityName === "Москва";
          }
          if (arg.area === "2" || arg.area === "petersburg") {
            return cityName === "Санкт-Петербург";
          }
          return true;
        });
      }

      if (arg.skill_set && arg.skill_set.length > 0) {
        filteredItems = filteredItems.filter((v) => {
          const requirement = (v.snippet?.requirement || "").toLowerCase();
          return arg.skill_set!.every((skill) => {
            const s = skill.toLowerCase().trim();

            if (s === "js" || s === "javascript") {
              return (
                requirement.includes("javascript") || requirement.includes("js")
              );
            }
            return requirement.includes(s);
          });
        });
      }

      const perPage = 10;
      const totalFound = filteredItems.length;
      const totalPages = Math.ceil(totalFound / perPage) || 1;

      const actualPage = arg.page >= totalPages ? 0 : arg.page;
      const offset = actualPage * perPage;
      const paginatedItems = filteredItems.slice(offset, offset + perPage);

      return {
        items: paginatedItems,
        found: totalFound,
        page: actualPage,
        pages: totalPages,
      };
    } catch (error) {
      return rejectWithValue("Ошибка загрузки данных");
    }
  },
);

export const fetchVacancyById = createAsyncThunk(
  "vacancies/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const vacancy = mockVacanciesResponse.items.find((v) => v.id === id);
      if (!vacancy) return rejectWithValue("Вакансия не найдена");
      return vacancy;
    } catch (error) {
      return rejectWithValue("Ошибка при получении вакансии");
    }
  },
);

const VacancySlice = createSlice({
  name: "vacancies",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    clearVacancies: (state) => {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(fetchVacancies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVacancies.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.items as unknown as Vacancy[];
        state.found = action.payload.found;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
      })
      .addCase(fetchVacancies.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Произошла ошибка";
      })

      .addCase(fetchVacancyById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVacancyById.fulfilled, (state, action) => {
        state.loading = false;

        const exists = state.list.find((v) => v.id === action.payload.id);
        if (!exists) state.list.push(action.payload as unknown as Vacancy);
      })
      .addCase(fetchVacancyById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Ошибка загрузки вакансии";
      });
  },
});

export const { setPage, clearVacancies } = VacancySlice.actions;

export default VacancySlice.reducer;
