import { useEffect } from "react";
import {
  Stack,
  Text,
  Loader,
  Center,
  Paper,
  Pagination,
  Tabs,
} from "@mantine/core";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../Store/store";
import { fetchVacancies, clearVacancies } from "../Store/Slices/vacancySlice";
import { VacancyCard } from "../VacancyCard/VacancyCard";
import { areaMap } from "../../Types/areas";
import { NotFoundPage } from "../NotFoundPage/NotFoundPage";

export const VacancyList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { city } = useParams<{ city: string }>();

  const VALID_CITIES = ["moscow", "petersburg"];

  const { list, loading, error, pages, page } = useSelector(
    (state: RootState) => state.vacancies,
  );

  useEffect(() => {
    if (city && !VALID_CITIES.includes(city)) return;
    dispatch(clearVacancies());
    const currentCity = city || "moscow";
    const textFromUrl = searchParams.get("text") || "";
    const skillsParam = searchParams.get("skills");

    const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);

    const skills = skillsParam ? skillsParam.split(",") : undefined;

    const areaId =
      areaMap[currentCity === "moscow" ? "Москва" : "Санкт-Петербург"];

    dispatch(
      fetchVacancies({
        text: textFromUrl,
        area: areaId,
        skill_set: skills,
        page: pageFromUrl - 1,
      }),
    );
  }, [dispatch, searchParams, city]);

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newPage > 1) {
      nextParams.set("page", newPage.toString());
    } else {
      nextParams.delete("page");
    }

    setSearchParams(nextParams);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTabChange = (value: string | null) => {
    if (!value) return;

    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("page");

    navigate({
      pathname: `/vacancies/${value}`,
      search: nextParams.toString(),
    });
  };

  if (city && !VALID_CITIES.includes(city)) {
    return <NotFoundPage />;
  }

  if (loading && list.length === 0) {
    return (
      <Center mt="xl" style={{ minHeight: "200px" }}>
        <Stack align="center">
          <Loader size="lg" color="indigo" />
          <Text size="xl" fw={500} c="dimmed">
            Загрузка вакансий...
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <Tabs
        value={city || "moscow"}
        onChange={handleTabChange}
        color="indigo.6"
        variant="default"
      >
        <Tabs.List mb="md" style={{ borderBottomWidth: "2px" }}>
          <Tabs.Tab value="moscow" p="md" fw={500}>
            Москва
          </Tabs.Tab>
          <Tabs.Tab value="petersburg" p="md" fw={500}>
            Санкт-Петербург
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {error ? (
        <Center mt="xl">
          <Paper
            p="xl"
            withBorder
            radius="md"
            bg="red.0"
            style={{ maxWidth: 500 }}
          >
            <Text c="red.9" fw={700} ta="center">
              Ошибка: {error}
            </Text>
          </Paper>
        </Center>
      ) : list.length > 0 ? (
        <>
          {list.map((vacancy) => (
            <VacancyCard key={vacancy.id} vacancy={vacancy} />
          ))}

          {pages > 1 && (
            <Center mt="lg" pb="xl">
              <Pagination
                total={pages}
                value={page + 1}
                onChange={handlePageChange}
                color="indigo.6"
                radius="md"
              />
            </Center>
          )}
        </>
      ) : (
        !loading && (
          <Paper p="xl" withBorder radius="md">
            <Center>
              <Text c="dimmed">
                Вакансий не найдено. Попробуйте изменить параметры поиска.
              </Text>
            </Center>
          </Paper>
        )
      )}
    </Stack>
  );
};
