# coordenadas-utm

Coordenadas-utm é uma biblioteca JavaScript que transforma coordenadas geográficas em grau para coordenadas UTM, e vice-versa, de maneira simplificada.
A conversão retorna um resultado bem próximo, portanto, os resultados não são 100% exatos.

## Instalação

```bash
npm install coordenadas-utm
```

## Utilização

### Função 'geographicToUTM'

Essa função transforma coordenadas geográficas em coordenadas UTM

Exemplo:

```javascript
const { geographicToUTM } = require("coordenadas-utm");

geographicToUTM({
  latitude: { degree: 20, minute: 14, second: 5.47 },
  longitude: { degree: 51, minute: 3, second: 30.46 },
  datum: "sad69",
  hemisphereLongitude: "oeste",
  hemisphereLatitude: "sul",
});
// { x: 493893.7599313202, y: 7762520.733886789 }
```

### Função 'UTMToGeographic'

Essa função transforma coordenadas UTM em coordenadas geográficas

Exemplo:

```javascript
const { UTMToGeographic } = require("coordenadas-utm");

UTMToGeographic({
  x: 493893.842883,
  y: 7762520.599209,
  datum: "sad69",
  hemisphereLatitude: "sul",
  zone: 22,
});
// {
//   latitude: `-20° 14' 5.474379541697374"`,
//   longitude: `-51° 3' 30.457142594000857"`
// }
```

### Configurações

É possível passar um objeto de configurações em ambas as funções logo após o objeto de dados, para se obter um resultado personalizado

Objeto:

```javascript
const config = {
  mask: "String no formato em que o dado será retornado, substituindo os colchetes pelos seus respectivos valores",
  fixed: "Number que define a quantidade de dígitos após o ponto decimal",
};
```

Exemplo:

```javascript
const { geographicToUTM, UTMToGeographic } = require("coordenadas-utm");

geographicToUTM(
  {
    latitude: { degree: 20, minute: 14, second: 5.47 },
    longitude: { degree: 51, minute: 3, second: 30.46 },
    datum: "sad69",
    hemisphereLongitude: "oeste",
    hemisphereLatitude: "sul",
  },
  {
    mask: "[x]m, [y]m",
    fixed: 2,
  }
);
// 493893.76m, 7762520.73m
// [x] = substitui pelo valor de X
// [y] = substitui pelo valor de y

UTMToGeographic(
  {
    x: 493893.842883,
    y: 7762520.599209,
    datum: "sad69",
    hemisphereLatitude: "sul",
    zone: 22,
  },
  {
    mask: "[signal][dd]d [mm]m [ss]s",
    fixed: 2,
  }
);
// { latitude: '-20d 14m 5.47s', longitude: '-51d 3m 30.46s' }
// [signal] = substitui pelo sinal (positivo não terá sinal de +)
// [dd] = substitui pelo grau
// [mm] = substitui pelo minuto
// [ss] = substitui pelo segundo
```
