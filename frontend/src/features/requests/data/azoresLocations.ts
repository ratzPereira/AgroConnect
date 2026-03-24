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
          { name: 'Ajuda', lat: 37.7400, lng: -25.6625 },
          { name: 'Arrifes', lat: 37.7550, lng: -25.6900 },
          { name: 'Candelária', lat: 37.7800, lng: -25.7450 },
          { name: 'Capelas', lat: 37.7833, lng: -25.7283 },
          { name: 'Covoada', lat: 37.7700, lng: -25.7100 },
          { name: 'Fajã de Baixo', lat: 37.7467, lng: -25.6533 },
          { name: 'Fajã de Cima', lat: 37.7550, lng: -25.6567 },
          { name: 'Fenais da Luz', lat: 37.7917, lng: -25.7050 },
          { name: 'Feteiras', lat: 37.7600, lng: -25.7700 },
          { name: 'Ginetes', lat: 37.7750, lng: -25.8450 },
          { name: 'Livramento', lat: 37.7383, lng: -25.6417 },
          { name: 'Mosteiros', lat: 37.7833, lng: -25.8183 },
          { name: 'Pilar da Bretanha', lat: 37.7917, lng: -25.8517 },
          { name: 'Relva', lat: 37.7700, lng: -25.7200 },
          { name: 'Remédios', lat: 37.7550, lng: -25.7333 },
          { name: 'Santa Bárbara', lat: 37.7867, lng: -25.7917 },
          { name: 'Santa Clara', lat: 37.7417, lng: -25.6717 },
          { name: 'Santo António', lat: 37.7550, lng: -25.6750 },
          { name: 'São José', lat: 37.7417, lng: -25.6683 },
          { name: 'São Pedro', lat: 37.7400, lng: -25.6750 },
          { name: 'São Roque', lat: 37.7500, lng: -25.6400 },
          { name: 'São Sebastião', lat: 37.7383, lng: -25.6600 },
          { name: 'São Vicente Ferreira', lat: 37.7917, lng: -25.7417 },
          { name: 'Sete Cidades', lat: 37.7650, lng: -25.7833 },
        ],
      },
      {
        name: 'Ribeira Grande',
        lat: 37.8117,
        lng: -25.5150,
        parishes: [
          { name: 'Calhetas', lat: 37.7950, lng: -25.4833 },
          { name: 'Conceição', lat: 37.8100, lng: -25.5167 },
          { name: 'Fenais da Ajuda', lat: 37.8250, lng: -25.4483 },
          { name: 'Lomba da Maia', lat: 37.8233, lng: -25.4100 },
          { name: 'Lomba de São Pedro', lat: 37.8000, lng: -25.4617 },
          { name: 'Maia', lat: 37.8200, lng: -25.3933 },
          { name: 'Matriz', lat: 37.8117, lng: -25.5200 },
          { name: 'Pico da Pedra', lat: 37.7967, lng: -25.5400 },
          { name: 'Porto Formoso', lat: 37.8233, lng: -25.4300 },
          { name: 'Rabo de Peixe', lat: 37.8033, lng: -25.5833 },
          { name: 'Ribeira Seca', lat: 37.7917, lng: -25.4950 },
          { name: 'Ribeirinha', lat: 37.8150, lng: -25.5400 },
          { name: 'Santa Bárbara', lat: 37.7867, lng: -25.5567 },
          { name: 'São Brás', lat: 37.7933, lng: -25.5250 },
        ],
      },
      {
        name: 'Lagoa',
        lat: 37.7450,
        lng: -25.5800,
        parishes: [
          { name: 'Água de Pau', lat: 37.7500, lng: -25.5317 },
          { name: 'Cabouco', lat: 37.7567, lng: -25.5733 },
          { name: 'Lagoa (Nossa Senhora do Rosário)', lat: 37.7433, lng: -25.5783 },
          { name: 'Lagoa (Santa Cruz)', lat: 37.7467, lng: -25.5850 },
          { name: 'Ribeira Chã', lat: 37.7550, lng: -25.5550 },
          { name: 'Atalhada', lat: 37.7400, lng: -25.5683 },
        ],
      },
      {
        name: 'Vila Franca do Campo',
        lat: 37.7150,
        lng: -25.4317,
        parishes: [
          { name: 'Água d\'Alto', lat: 37.7300, lng: -25.4600 },
          { name: 'Ponta Garça', lat: 37.7167, lng: -25.3833 },
          { name: 'Ribeira das Tainhas', lat: 37.7317, lng: -25.4367 },
          { name: 'São Miguel', lat: 37.7167, lng: -25.4333 },
          { name: 'São Pedro', lat: 37.7133, lng: -25.4500 },
        ],
      },
      {
        name: 'Nordeste',
        lat: 37.8300,
        lng: -25.1300,
        parishes: [
          { name: 'Achada', lat: 37.8150, lng: -25.1267 },
          { name: 'Achadinha', lat: 37.8167, lng: -25.1583 },
          { name: 'Algarvia', lat: 37.8050, lng: -25.1917 },
          { name: 'Lomba da Fazenda', lat: 37.8283, lng: -25.1000 },
          { name: 'Nordeste', lat: 37.8300, lng: -25.1283 },
          { name: 'Nordestinho', lat: 37.8217, lng: -25.1450 },
          { name: 'Salga', lat: 37.8133, lng: -25.1750 },
          { name: 'Santana', lat: 37.8250, lng: -25.1617 },
          { name: 'São Pedro Nordestinho', lat: 37.8233, lng: -25.1533 },
        ],
      },
      {
        name: 'Povoação',
        lat: 37.7617,
        lng: -25.2383,
        parishes: [
          { name: 'Água Retorta', lat: 37.7833, lng: -25.2017 },
          { name: 'Faial da Terra', lat: 37.7650, lng: -25.2100 },
          { name: 'Furnas', lat: 37.7733, lng: -25.3117 },
          { name: 'Nossa Senhora dos Remédios', lat: 37.7600, lng: -25.2467 },
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
          { name: 'Cinco Ribeiras', lat: 38.7067, lng: -27.3000 },
          { name: 'Doze Ribeiras', lat: 38.7200, lng: -27.3150 },
          { name: 'Feteira', lat: 38.6700, lng: -27.2600 },
          { name: 'Conceição', lat: 38.6583, lng: -27.2150 },
          { name: 'Posto Santo', lat: 38.6900, lng: -27.2850 },
          { name: 'Raminho', lat: 38.7100, lng: -27.2900 },
          { name: 'Ribeirinha', lat: 38.6917, lng: -27.1900 },
          { name: 'Santa Bárbara', lat: 38.7283, lng: -27.2367 },
          { name: 'Santa Luzia', lat: 38.6617, lng: -27.2267 },
          { name: 'São Bartolomeu de Regatos', lat: 38.6850, lng: -27.2733 },
          { name: 'São Bento', lat: 38.6750, lng: -27.2283 },
          { name: 'São Mateus da Calheta', lat: 38.6867, lng: -27.2550 },
          { name: 'São Pedro', lat: 38.6533, lng: -27.2233 },
          { name: 'Sé', lat: 38.6550, lng: -27.2167 },
          { name: 'Serreta', lat: 38.7350, lng: -27.3200 },
          { name: 'Terra Chã', lat: 38.6700, lng: -27.2050 },
          { name: 'Vila de São Sebastião', lat: 38.6717, lng: -27.1617 },
        ],
      },
      {
        name: 'Praia da Vitória',
        lat: 38.7333,
        lng: -27.0667,
        parishes: [
          { name: 'Agualva', lat: 38.7400, lng: -27.1650 },
          { name: 'Biscoitos', lat: 38.7567, lng: -27.2050 },
          { name: 'Cabo da Praia', lat: 38.7233, lng: -27.0400 },
          { name: 'Fonte do Bastardo', lat: 38.7200, lng: -27.1083 },
          { name: 'Fontinhas', lat: 38.7233, lng: -27.0700 },
          { name: 'Lajes', lat: 38.7067, lng: -27.0850 },
          { name: 'Porto Judeu', lat: 38.6900, lng: -27.1333 },
          { name: 'Quatro Ribeiras', lat: 38.7483, lng: -27.1850 },
          { name: 'Santa Cruz', lat: 38.7350, lng: -27.0617 },
          { name: 'São Brás', lat: 38.7300, lng: -27.1300 },
          { name: 'Vila Nova', lat: 38.7283, lng: -27.0950 },
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
        lat: 38.5350,
        lng: -28.6300,
        parishes: [
          { name: 'Angústias', lat: 38.5317, lng: -28.6333 },
          { name: 'Capelo', lat: 38.5800, lng: -28.7900 },
          { name: 'Castelo Branco', lat: 38.5183, lng: -28.6983 },
          { name: 'Cedros', lat: 38.5717, lng: -28.7417 },
          { name: 'Conceição', lat: 38.5383, lng: -28.6267 },
          { name: 'Feteira', lat: 38.5250, lng: -28.6583 },
          { name: 'Flamengos', lat: 38.5467, lng: -28.6550 },
          { name: 'Matriz', lat: 38.5333, lng: -28.6233 },
          { name: 'Pedro Miguel', lat: 38.5583, lng: -28.6850 },
          { name: 'Praia do Almoxarife', lat: 38.5517, lng: -28.6483 },
          { name: 'Praia do Norte', lat: 38.5783, lng: -28.7717 },
          { name: 'Ribeirinha', lat: 38.5617, lng: -28.6200 },
          { name: 'Salão', lat: 38.5650, lng: -28.7117 },
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
          { name: 'Bandeiras', lat: 38.5250, lng: -28.4817 },
          { name: 'Candelária', lat: 38.5083, lng: -28.5183 },
          { name: 'Criação Velha', lat: 38.5200, lng: -28.5517 },
          { name: 'Madalena', lat: 38.5350, lng: -28.5267 },
          { name: 'São Caetano', lat: 38.5033, lng: -28.4567 },
          { name: 'São Mateus', lat: 38.5100, lng: -28.4217 },
        ],
      },
      {
        name: 'São Roque do Pico',
        lat: 38.5167,
        lng: -28.3167,
        parishes: [
          { name: 'Prainha', lat: 38.4917, lng: -28.3183 },
          { name: 'Santa Luzia', lat: 38.5200, lng: -28.3483 },
          { name: 'Santo Amaro', lat: 38.5100, lng: -28.3683 },
          { name: 'Santo António', lat: 38.5133, lng: -28.2833 },
          { name: 'São Roque', lat: 38.5233, lng: -28.3117 },
        ],
      },
      {
        name: 'Lajes do Pico',
        lat: 38.3900,
        lng: -28.2500,
        parishes: [
          { name: 'Calheta de Nesquim', lat: 38.4167, lng: -28.2083 },
          { name: 'Lajes do Pico', lat: 38.3917, lng: -28.2533 },
          { name: 'Piedade', lat: 38.3800, lng: -28.1750 },
          { name: 'Ribeiras', lat: 38.4267, lng: -28.2533 },
          { name: 'Ribeirinha', lat: 38.4433, lng: -28.2800 },
          { name: 'São João', lat: 38.4100, lng: -28.2333 },
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
        lng: -28.2050,
        parishes: [
          { name: 'Manadas', lat: 38.6567, lng: -28.1633 },
          { name: 'Norte Grande', lat: 38.6750, lng: -28.1450 },
          { name: 'Norte Pequeno', lat: 38.6617, lng: -28.0917 },
          { name: 'Rosais', lat: 38.6900, lng: -28.2533 },
          { name: 'Santo Amaro', lat: 38.6650, lng: -28.1067 },
          { name: 'Urzelina', lat: 38.6517, lng: -28.1833 },
          { name: 'Velas', lat: 38.6800, lng: -28.2083 },
        ],
      },
      {
        name: 'Calheta',
        lat: 38.6000,
        lng: -27.9500,
        parishes: [
          { name: 'Calheta', lat: 38.6017, lng: -27.9483 },
          { name: 'Norte Grande', lat: 38.6433, lng: -28.0217 },
          { name: 'Ribeira Seca', lat: 38.6367, lng: -27.9983 },
          { name: 'Santo Antão', lat: 38.6217, lng: -27.9650 },
          { name: 'Topo', lat: 38.5533, lng: -27.7617 },
        ],
      },
    ],
  },
  {
    name: 'Graciosa',
    lat: 39.05,
    lng: -28.00,
    zoom: 12,
    municipalities: [
      {
        name: 'Santa Cruz da Graciosa',
        lat: 39.0833,
        lng: -28.0017,
        parishes: [
          { name: 'Guadalupe', lat: 39.0617, lng: -28.0150 },
          { name: 'Luz', lat: 39.0550, lng: -28.0433 },
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
        lng: -31.1150,
        parishes: [
          { name: 'Caveira', lat: 39.4467, lng: -31.1567 },
          { name: 'Cedros', lat: 39.4800, lng: -31.1633 },
          { name: 'Ponta Delgada', lat: 39.4833, lng: -31.1317 },
          { name: 'Santa Cruz das Flores', lat: 39.4550, lng: -31.1133 },
        ],
      },
      {
        name: 'Lajes das Flores',
        lat: 39.3817,
        lng: -31.1700,
        parishes: [
          { name: 'Fajã Grande', lat: 39.4483, lng: -31.2600 },
          { name: 'Fajãzinha', lat: 39.4383, lng: -31.2550 },
          { name: 'Fazenda', lat: 39.4233, lng: -31.2050 },
          { name: 'Lajedo', lat: 39.4050, lng: -31.1850 },
          { name: 'Lajes das Flores', lat: 39.3817, lng: -31.1717 },
          { name: 'Lomba', lat: 39.3967, lng: -31.1450 },
          { name: 'Mosteiro', lat: 39.4133, lng: -31.1267 },
        ],
      },
    ],
  },
  {
    name: 'Corvo',
    lat: 39.70,
    lng: -31.11,
    zoom: 13,
    municipalities: [
      {
        name: 'Corvo',
        lat: 39.6750,
        lng: -31.1083,
        parishes: [
          { name: 'Nossa Senhora dos Milagres', lat: 39.6750, lng: -31.1083 },
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
          { name: 'Almagreira', lat: 36.9700, lng: -25.1333 },
          { name: 'Santa Bárbara', lat: 36.9817, lng: -25.0717 },
          { name: 'Santo Espírito', lat: 36.9550, lng: -25.0400 },
          { name: 'São Pedro', lat: 36.9583, lng: -25.1050 },
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
