export interface AzoresParish {
  name: string;
  lat: number;
  lng: number;
}

export interface AzoresMunicipality {
  name: string;
  lat: number;
  lng: number;
  parishes: AzoresParish[];
}

export interface AzoresIsland {
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  municipalities: AzoresMunicipality[];
}

export const AZORES_ISLANDS: AzoresIsland[] = [
  {
    name: 'São Miguel',
    lat: 37.75,
    lng: -25.67,
    zoom: 10,
    municipalities: [
      {
        name: 'Ponta Delgada',
        lat: 37.7433,
        lng: -25.6692,
        parishes: [
          { name: 'Ajuda', lat: 37.74, lng: -25.6625 },
          { name: 'Arrifes', lat: 37.755, lng: -25.69 },
          { name: 'Candelária', lat: 37.78, lng: -25.745 },
          { name: 'Capelas', lat: 37.7833, lng: -25.7283 },
          { name: 'Covoada', lat: 37.77, lng: -25.71 },
          { name: 'Fajã de Baixo', lat: 37.7467, lng: -25.6533 },
          { name: 'Fajã de Cima', lat: 37.755, lng: -25.6567 },
          { name: 'Fenais da Luz', lat: 37.7917, lng: -25.705 },
          { name: 'Feteiras', lat: 37.76, lng: -25.77 },
          { name: 'Ginetes', lat: 37.775, lng: -25.845 },
          { name: 'Livramento', lat: 37.7383, lng: -25.6417 },
          { name: 'Mosteiros', lat: 37.7833, lng: -25.8183 },
          { name: 'Pilar da Bretanha', lat: 37.7917, lng: -25.8517 },
          { name: 'Relva', lat: 37.77, lng: -25.72 },
          { name: 'Remédios', lat: 37.755, lng: -25.7333 },
          { name: 'Santa Bárbara', lat: 37.7867, lng: -25.7917 },
          { name: 'Santa Clara', lat: 37.7417, lng: -25.6717 },
          { name: 'Santo António', lat: 37.755, lng: -25.675 },
          { name: 'São José', lat: 37.7417, lng: -25.6683 },
          { name: 'São Pedro', lat: 37.74, lng: -25.675 },
          { name: 'São Roque', lat: 37.75, lng: -25.64 },
          { name: 'São Sebastião', lat: 37.7383, lng: -25.66 },
          { name: 'São Vicente Ferreira', lat: 37.7917, lng: -25.7417 },
          { name: 'Sete Cidades', lat: 37.765, lng: -25.7833 },
        ],
      },
      {
        name: 'Ribeira Grande',
        lat: 37.8117,
        lng: -25.515,
        parishes: [
          { name: 'Calhetas', lat: 37.795, lng: -25.4833 },
          { name: 'Conceição', lat: 37.81, lng: -25.5167 },
          { name: 'Fenais da Ajuda', lat: 37.825, lng: -25.4483 },
          { name: 'Lomba da Maia', lat: 37.8233, lng: -25.41 },
          { name: 'Lomba de São Pedro', lat: 37.8, lng: -25.4617 },
          { name: 'Maia', lat: 37.82, lng: -25.3933 },
          { name: 'Matriz', lat: 37.8117, lng: -25.52 },
          { name: 'Pico da Pedra', lat: 37.7967, lng: -25.54 },
          { name: 'Porto Formoso', lat: 37.8233, lng: -25.43 },
          { name: 'Rabo de Peixe', lat: 37.8033, lng: -25.5833 },
          { name: 'Ribeira Seca', lat: 37.7917, lng: -25.495 },
          { name: 'Ribeirinha', lat: 37.815, lng: -25.54 },
          { name: 'Santa Bárbara', lat: 37.7867, lng: -25.5567 },
          { name: 'São Brás', lat: 37.7933, lng: -25.525 },
        ],
      },
      {
        name: 'Lagoa',
        lat: 37.745,
        lng: -25.58,
        parishes: [
          { name: 'Água de Pau', lat: 37.75, lng: -25.5317 },
          { name: 'Cabouco', lat: 37.7567, lng: -25.5733 },
          { name: 'Lagoa (Nossa Senhora do Rosário)', lat: 37.7433, lng: -25.5783 },
          { name: 'Lagoa (Santa Cruz)', lat: 37.7467, lng: -25.585 },
          { name: 'Ribeira Chã', lat: 37.755, lng: -25.555 },
          { name: 'Atalhada', lat: 37.74, lng: -25.5683 },
        ],
      },
      {
        name: 'Vila Franca do Campo',
        lat: 37.715,
        lng: -25.4317,
        parishes: [
          { name: 'Água d\'Alto', lat: 37.73, lng: -25.46 },
          { name: 'Ponta Garça', lat: 37.7167, lng: -25.3833 },
          { name: 'Ribeira das Tainhas', lat: 37.7317, lng: -25.4367 },
          { name: 'São Miguel', lat: 37.7167, lng: -25.4333 },
          { name: 'São Pedro', lat: 37.7133, lng: -25.45 },
        ],
      },
      {
        name: 'Nordeste',
        lat: 37.83,
        lng: -25.13,
        parishes: [
          { name: 'Achada', lat: 37.815, lng: -25.1267 },
          { name: 'Achadinha', lat: 37.8167, lng: -25.1583 },
          { name: 'Algarvia', lat: 37.805, lng: -25.1917 },
          { name: 'Lomba da Fazenda', lat: 37.8283, lng: -25.1 },
          { name: 'Nordeste', lat: 37.83, lng: -25.1283 },
          { name: 'Nordestinho', lat: 37.8217, lng: -25.145 },
          { name: 'Salga', lat: 37.8133, lng: -25.175 },
          { name: 'Santana', lat: 37.825, lng: -25.1617 },
          { name: 'São Pedro Nordestinho', lat: 37.8233, lng: -25.1533 },
        ],
      },
      {
        name: 'Povoação',
        lat: 37.7617,
        lng: -25.2383,
        parishes: [
          { name: 'Água Retorta', lat: 37.7833, lng: -25.2017 },
          { name: 'Faial da Terra', lat: 37.765, lng: -25.21 },
          { name: 'Furnas', lat: 37.7733, lng: -25.3117 },
          { name: 'Nossa Senhora dos Remédios', lat: 37.76, lng: -25.2467 },
          { name: 'Povoação', lat: 37.7617, lng: -25.2383 },
          { name: 'Ribeira Quente', lat: 37.7467, lng: -25.2867 },
        ],
      },
    ],
  },
  {
    name: 'Terceira',
    lat: 38.72,
    lng: -27.22,
    zoom: 11,
    municipalities: [
      {
        name: 'Angra do Heroísmo',
        lat: 38.6567,
        lng: -27.2167,
        parishes: [
          { name: 'Altares', lat: 38.7233, lng: -27.2717 },
          { name: 'Cinco Ribeiras', lat: 38.7067, lng: -27.3 },
          { name: 'Doze Ribeiras', lat: 38.72, lng: -27.315 },
          { name: 'Feteira', lat: 38.67, lng: -27.26 },
          { name: 'Conceição', lat: 38.6583, lng: -27.215 },
          { name: 'Posto Santo', lat: 38.69, lng: -27.285 },
          { name: 'Raminho', lat: 38.71, lng: -27.29 },
          { name: 'Ribeirinha', lat: 38.6917, lng: -27.19 },
          { name: 'Santa Bárbara', lat: 38.7283, lng: -27.2367 },
          { name: 'Santa Luzia', lat: 38.6617, lng: -27.2267 },
          { name: 'São Bartolomeu de Regatos', lat: 38.685, lng: -27.2733 },
          { name: 'São Bento', lat: 38.675, lng: -27.2283 },
          { name: 'São Mateus da Calheta', lat: 38.6867, lng: -27.255 },
          { name: 'São Pedro', lat: 38.6533, lng: -27.2233 },
          { name: 'Sé', lat: 38.655, lng: -27.2167 },
          { name: 'Serreta', lat: 38.735, lng: -27.32 },
          { name: 'Terra Chã', lat: 38.67, lng: -27.205 },
          { name: 'Vila de São Sebastião', lat: 38.6717, lng: -27.1617 },
        ],
      },
      {
        name: 'Praia da Vitória',
        lat: 38.7333,
        lng: -27.0667,
        parishes: [
          { name: 'Agualva', lat: 38.74, lng: -27.165 },
          { name: 'Biscoitos', lat: 38.7567, lng: -27.205 },
          { name: 'Cabo da Praia', lat: 38.7233, lng: -27.04 },
          { name: 'Fonte do Bastardo', lat: 38.72, lng: -27.1083 },
          { name: 'Fontinhas', lat: 38.7233, lng: -27.07 },
          { name: 'Lajes', lat: 38.7067, lng: -27.085 },
          { name: 'Porto Judeu', lat: 38.69, lng: -27.1333 },
          { name: 'Quatro Ribeiras', lat: 38.7483, lng: -27.185 },
          { name: 'Santa Cruz', lat: 38.735, lng: -27.0617 },
          { name: 'São Brás', lat: 38.73, lng: -27.13 },
          { name: 'Vila Nova', lat: 38.7283, lng: -27.095 },
        ],
      },
    ],
  },
  {
    name: 'Faial',
    lat: 38.55,
    lng: -28.72,
    zoom: 12,
    municipalities: [
      {
        name: 'Horta',
        lat: 38.535,
        lng: -28.63,
        parishes: [
          { name: 'Angústias', lat: 38.5317, lng: -28.6333 },
          { name: 'Capelo', lat: 38.58, lng: -28.79 },
          { name: 'Castelo Branco', lat: 38.5183, lng: -28.6983 },
          { name: 'Cedros', lat: 38.5717, lng: -28.7417 },
          { name: 'Conceição', lat: 38.5383, lng: -28.6267 },
          { name: 'Feteira', lat: 38.525, lng: -28.6583 },
          { name: 'Flamengos', lat: 38.5467, lng: -28.655 },
          { name: 'Matriz', lat: 38.5333, lng: -28.6233 },
          { name: 'Pedro Miguel', lat: 38.5583, lng: -28.685 },
          { name: 'Praia do Almoxarife', lat: 38.5517, lng: -28.6483 },
          { name: 'Praia do Norte', lat: 38.5783, lng: -28.7717 },
          { name: 'Ribeirinha', lat: 38.5617, lng: -28.62 },
          { name: 'Salão', lat: 38.565, lng: -28.7117 },
        ],
      },
    ],
  },
  {
    name: 'Pico',
    lat: 38.47,
    lng: -28.33,
    zoom: 11,
    municipalities: [
      {
        name: 'Madalena',
        lat: 38.5333,
        lng: -28.5333,
        parishes: [
          { name: 'Bandeiras', lat: 38.525, lng: -28.4817 },
          { name: 'Candelária', lat: 38.5083, lng: -28.5183 },
          { name: 'Criação Velha', lat: 38.52, lng: -28.5517 },
          { name: 'Madalena', lat: 38.535, lng: -28.5267 },
          { name: 'São Caetano', lat: 38.5033, lng: -28.4567 },
          { name: 'São Mateus', lat: 38.51, lng: -28.4217 },
        ],
      },
      {
        name: 'São Roque do Pico',
        lat: 38.5167,
        lng: -28.3167,
        parishes: [
          { name: 'Prainha', lat: 38.4917, lng: -28.3183 },
          { name: 'Santa Luzia', lat: 38.52, lng: -28.3483 },
          { name: 'Santo Amaro', lat: 38.51, lng: -28.3683 },
          { name: 'Santo António', lat: 38.5133, lng: -28.2833 },
          { name: 'São Roque', lat: 38.5233, lng: -28.3117 },
        ],
      },
      {
        name: 'Lajes do Pico',
        lat: 38.39,
        lng: -28.25,
        parishes: [
          { name: 'Calheta de Nesquim', lat: 38.4167, lng: -28.2083 },
          { name: 'Lajes do Pico', lat: 38.3917, lng: -28.2533 },
          { name: 'Piedade', lat: 38.38, lng: -28.175 },
          { name: 'Ribeiras', lat: 38.4267, lng: -28.2533 },
          { name: 'Ribeirinha', lat: 38.4433, lng: -28.28 },
          { name: 'São João', lat: 38.41, lng: -28.2333 },
        ],
      },
    ],
  },
  {
    name: 'São Jorge',
    lat: 38.65,
    lng: -28.05,
    zoom: 11,
    municipalities: [
      {
        name: 'Velas',
        lat: 38.6833,
        lng: -28.205,
        parishes: [
          { name: 'Manadas', lat: 38.6567, lng: -28.1633 },
          { name: 'Norte Grande', lat: 38.675, lng: -28.145 },
          { name: 'Norte Pequeno', lat: 38.6617, lng: -28.0917 },
          { name: 'Rosais', lat: 38.69, lng: -28.2533 },
          { name: 'Santo Amaro', lat: 38.665, lng: -28.1067 },
          { name: 'Urzelina', lat: 38.6517, lng: -28.1833 },
          { name: 'Velas', lat: 38.68, lng: -28.2083 },
        ],
      },
      {
        name: 'Calheta',
        lat: 38.6,
        lng: -27.95,
        parishes: [
          { name: 'Calheta', lat: 38.6017, lng: -27.9483 },
          { name: 'Norte Grande', lat: 38.6433, lng: -28.0217 },
          { name: 'Ribeira Seca', lat: 38.6367, lng: -27.9983 },
          { name: 'Santo Antão', lat: 38.6217, lng: -27.965 },
          { name: 'Topo', lat: 38.5533, lng: -27.7617 },
        ],
      },
    ],
  },
  {
    name: 'Graciosa',
    lat: 39.05,
    lng: -28,
    zoom: 12,
    municipalities: [
      {
        name: 'Santa Cruz da Graciosa',
        lat: 39.0833,
        lng: -28.0017,
        parishes: [
          { name: 'Guadalupe', lat: 39.0617, lng: -28.015 },
          { name: 'Luz', lat: 39.055, lng: -28.0433 },
          { name: 'Praia (São Mateus)', lat: 39.0683, lng: -27.9683 },
          { name: 'Santa Cruz da Graciosa', lat: 39.0867, lng: -27.9933 },
        ],
      },
    ],
  },
  {
    name: 'Flores',
    lat: 39.45,
    lng: -31.18,
    zoom: 12,
    municipalities: [
      {
        name: 'Santa Cruz das Flores',
        lat: 39.4533,
        lng: -31.115,
        parishes: [
          { name: 'Caveira', lat: 39.4467, lng: -31.1567 },
          { name: 'Cedros', lat: 39.48, lng: -31.1633 },
          { name: 'Ponta Delgada', lat: 39.4833, lng: -31.1317 },
          { name: 'Santa Cruz das Flores', lat: 39.455, lng: -31.1133 },
        ],
      },
      {
        name: 'Lajes das Flores',
        lat: 39.3817,
        lng: -31.17,
        parishes: [
          { name: 'Fajã Grande', lat: 39.4483, lng: -31.26 },
          { name: 'Fajãzinha', lat: 39.4383, lng: -31.255 },
          { name: 'Fazenda', lat: 39.4233, lng: -31.205 },
          { name: 'Lajedo', lat: 39.405, lng: -31.185 },
          { name: 'Lajes das Flores', lat: 39.3817, lng: -31.1717 },
          { name: 'Lomba', lat: 39.3967, lng: -31.145 },
          { name: 'Mosteiro', lat: 39.4133, lng: -31.1267 },
        ],
      },
    ],
  },
  {
    name: 'Corvo',
    lat: 39.7,
    lng: -31.11,
    zoom: 13,
    municipalities: [
      {
        name: 'Corvo',
        lat: 39.675,
        lng: -31.1083,
        parishes: [
          { name: 'Nossa Senhora dos Milagres', lat: 39.675, lng: -31.1083 },
        ],
      },
    ],
  },
  {
    name: 'Santa Maria',
    lat: 36.97,
    lng: -25.09,
    zoom: 12,
    municipalities: [
      {
        name: 'Vila do Porto',
        lat: 36.9467,
        lng: -25.0983,
        parishes: [
          { name: 'Almagreira', lat: 36.97, lng: -25.1333 },
          { name: 'Santa Bárbara', lat: 36.9817, lng: -25.0717 },
          { name: 'Santo Espírito', lat: 36.955, lng: -25.04 },
          { name: 'São Pedro', lat: 36.9583, lng: -25.105 },
          { name: 'Vila do Porto', lat: 36.9467, lng: -25.0983 },
        ],
      },
    ],
  },
];

// Azores bounding box for coordinate validation
export const AZORES_BOUNDS = {
  minLat: 36.9,
  maxLat: 39.8,
  minLng: -31.3,
  maxLng: -24.7,
} as const;

// Default center for all Azores
export const AZORES_CENTER = { lat: 38.7, lng: -27.2, zoom: 6 } as const;

export function findIsland(name: string): AzoresIsland | undefined {
  return AZORES_ISLANDS.find((i) => i.name === name);
}

export function findMunicipality(
  islandName: string,
  municipalityName: string,
): AzoresMunicipality | undefined {
  const island = findIsland(islandName);
  return island?.municipalities.find((m) => m.name === municipalityName);
}

export function findParish(
  islandName: string,
  municipalityName: string,
  parishName: string,
): AzoresParish | undefined {
  const municipality = findMunicipality(islandName, municipalityName);
  return municipality?.parishes.find((p) => p.name === parishName);
}
