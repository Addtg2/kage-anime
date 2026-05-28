import { gql } from "graphql-request";

// Список аниме с фильтрами. Типы переменных подтверждены интроспекцией:
// order=OrderEnum, kind=AnimeKindString, status=AnimeStatusString,
// season=SeasonString, page/limit=PositiveInt (limit ≤ 50).
export const ANIMES_LIST = gql`
  query AnimesList(
    $page: PositiveInt
    $limit: PositiveInt
    $order: OrderEnum
    $kind: AnimeKindString
    $status: AnimeStatusString
    $season: SeasonString
    $search: String
    $genre: String
  ) {
    animes(
      page: $page
      limit: $limit
      order: $order
      kind: $kind
      status: $status
      season: $season
      search: $search
      genre: $genre
    ) {
      id
      malId
      name
      russian
      japanese
      kind
      status
      score
      episodes
      episodesAired
      duration
      rating
      season
      nextEpisodeAt
      description
      airedOn {
        year
        date
      }
      poster {
        mainUrl
        originalUrl
      }
      genres {
        id
        russian
        kind
      }
    }
  }
`;

// Расширенные поля тайтла: трейлеры/опенинги/эндинги, скриншоты, связанные
// (приквел/сиквел/спин-офф). Запрашиваются отдельно, чтобы один сбой не валил
// основной DETAIL.
export const ANIME_EXTRAS = gql`
  query AnimeExtras($ids: String!) {
    animes(ids: $ids, limit: 1) {
      id
      videos {
        id
        url
        playerUrl
        name
        kind
      }
      screenshots {
        id
        originalUrl
        x166Url
      }
      related {
        relationRu
        anime {
          id
          russian
          name
          score
          airedOn {
            year
          }
          poster {
            mainUrl
          }
        }
      }
    }
  }
`;

// Детальная карточка одного тайтла по id (+ описание, студии).
export const ANIME_DETAIL = gql`
  query AnimeDetail($ids: String!) {
    animes(ids: $ids, limit: 1) {
      id
      malId
      name
      russian
      japanese
      kind
      status
      score
      episodes
      episodesAired
      duration
      rating
      season
      nextEpisodeAt
      description
      airedOn {
        year
        date
      }
      poster {
        mainUrl
        originalUrl
      }
      genres {
        id
        russian
        kind
      }
      studios {
        id
        name
      }
    }
  }
`;
