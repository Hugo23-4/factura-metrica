import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chips } from '@/components/chips';
import { FilaDato } from '@/components/fila-dato';
import { Pantalla } from '@/components/pantalla';
import { Tarjeta } from '@/components/tarjeta';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useTheme } from '@/hooks/use-theme';
import { baseDeducible, esDeducible, ivaDeducible } from '@/services/estado-gasto';
import type { Categoria, Gasto, Semaforo } from '@/types/gasto';
import { formatearImporte, NOMBRE_CATEGORIA } from '@/utils/formato';
import {
  etiquetaTrimestre,
  mismoTrimestre,
  perteneceATrimestre,
  ultimosTrimestres,
  type Trimestre,
} from '@/utils/trimestre';

const ALTURA_COLUMNA = 120;

/** Resumen fiscal por trimestre: lo que el autónomo puede deducir y cómo se reparte. */
export default function InformesScreen() {
  const theme = useTheme();
  const gastos = useGastosVisibles();
  const trimestres = ultimosTrimestres(new Date(), 4);
  const [indice, setIndice] = useState(0);
  const seleccionado = trimestres[indice];

  const delTrimestre = gastos.filter((g) => perteneceATrimestre(g.fechaEmision, seleccionado));
  const deducibles = delTrimestre.filter(esDeducible);
  const noDeducibles = delTrimestre.filter((g) => g.semaforo === 'rojo');
  const pendientes = delTrimestre.filter((g) => g.semaforo === 'amarillo' && !g.justificacion);

  // En los informes, la base y el IVA son siempre la parte deducible según la categoría.
  const VALOR = {
    baseImponible: baseDeducible,
    cuotaIva: ivaDeducible,
    total: (g: Gasto) => g.total,
  };
  const sumar = (lista: Gasto[], campo: keyof typeof VALOR) =>
    lista.reduce((suma, g) => suma + VALOR[campo](g), 0);

  const porCategoria = agrupar(deducibles, (g) => g.categoria)
    .map(([categoria, lista]) => ({
      categoria: categoria as Categoria,
      total: sumar(lista, 'baseImponible'),
    }))
    .sort((a, b) => b.total - a.total);
  const maxCategoria = Math.max(...porCategoria.map((c) => c.total), 1);

  const porTipoIva = agrupar(deducibles, (g) => String(g.tipoIva))
    .map(([tipo, lista]) => ({
      tipo: Number(tipo),
      base: sumar(lista, 'baseImponible'),
      cuota: sumar(lista, 'cuotaIva'),
    }))
    .sort((a, b) => b.tipo - a.tipo);

  const evolucion = [...trimestres].reverse().map((t) => ({
    trimestre: t,
    base: sumar(
      gastos.filter((g) => perteneceATrimestre(g.fechaEmision, t) && esDeducible(g)),
      'baseImponible',
    ),
  }));
  const maxEvolucion = Math.max(...evolucion.map((e) => e.base), 1);

  const reparto: { semaforo: Semaforo; etiqueta: string; total: number }[] = [
    {
      semaforo: 'verde',
      etiqueta: 'Deducible',
      total: sumar(
        delTrimestre.filter((g) => g.semaforo === 'verde'),
        'total',
      ),
    },
    {
      semaforo: 'amarillo',
      etiqueta: 'En revisión',
      total: sumar(
        delTrimestre.filter((g) => g.semaforo === 'amarillo'),
        'total',
      ),
    },
    { semaforo: 'rojo', etiqueta: 'No deducible', total: sumar(noDeducibles, 'total') },
  ];
  const totalReparto = reparto.reduce((suma, r) => suma + r.total, 0);

  return (
    <Pantalla enPestana titulo="Informes" antetitulo="Resumen fiscal">
      <Chips
        opciones={trimestres.map((t, i) => ({ valor: i, etiqueta: etiquetaTrimestre(t) }))}
        valor={indice}
        onCambio={setIndice}
      />

      <View style={styles.kpis}>
        <Kpi
          etiqueta="Base deducible"
          valor={formatearImporte(sumar(deducibles, 'baseImponible'))}
        />
        <Kpi
          etiqueta="IVA soportado deducible"
          valor={formatearImporte(sumar(deducibles, 'cuotaIva'))}
        />
        <Kpi etiqueta="Gasto no deducible" valor={formatearImporte(sumar(noDeducibles, 'total'))} />
        <Kpi etiqueta="Sin justificar" valor={String(pendientes.length)} />
      </View>

      {delTrimestre.length === 0 ? (
        <Tarjeta variante="relleno">
          <ThemedText type="small" themeColor="textSecondary">
            No hay gastos registrados en el {etiquetaTrimestre(seleccionado)}.
          </ThemedText>
        </Tarjeta>
      ) : (
        <>
          <Tarjeta>
            <ThemedText type="smallBold">Clasificación del gasto</ThemedText>
            <View style={styles.barraApilada}>
              {reparto
                .filter((r) => r.total > 0)
                .map((r) => (
                  <View
                    key={r.semaforo}
                    style={{ flex: r.total, backgroundColor: theme[r.semaforo] }}
                  />
                ))}
            </View>
            {reparto.map((r) => (
              <View key={r.semaforo} style={styles.leyenda}>
                <View style={[styles.muestra, { backgroundColor: theme[r.semaforo] }]} />
                <ThemedText type="small" style={styles.flex}>
                  {r.etiqueta}
                </ThemedText>
                <ThemedText type="smallBold">{formatearImporte(r.total)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.porcentaje}>
                  {totalReparto ? Math.round((r.total / totalReparto) * 100) : 0} %
                </ThemedText>
              </View>
            ))}
          </Tarjeta>

          <Tarjeta>
            <ThemedText type="smallBold">Base deducible por categoría</ThemedText>
            {porCategoria.length === 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                Todavía no hay gastos deducibles en este trimestre.
              </ThemedText>
            )}
            {porCategoria.map(({ categoria, total }) => (
              <View key={categoria} style={styles.categoria}>
                <View style={styles.leyenda}>
                  <ThemedText type="small" style={styles.flex}>
                    {NOMBRE_CATEGORIA[categoria]}
                  </ThemedText>
                  <ThemedText type="smallBold">{formatearImporte(total)}</ThemedText>
                </View>
                <View style={[styles.pista, { backgroundColor: theme.backgroundElement }]}>
                  <View
                    style={[
                      styles.barra,
                      { width: `${(total / maxCategoria) * 100}%`, backgroundColor: theme.primary },
                    ]}
                  />
                </View>
              </View>
            ))}
          </Tarjeta>

          {porTipoIva.length > 0 && (
            <Tarjeta>
              <ThemedText type="smallBold">IVA soportado para el modelo 303</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Desglose orientativo por tipo impositivo. Tu gestoría hará la liquidación final.
              </ThemedText>
              {porTipoIva.map(({ tipo, base, cuota }) => (
                <FilaDato
                  key={tipo}
                  etiqueta={`Al ${tipo} % · base ${formatearImporte(base)}`}
                  valor={formatearImporte(cuota)}
                />
              ))}
            </Tarjeta>
          )}
        </>
      )}

      <Tarjeta>
        <ThemedText type="smallBold">Evolución de la base deducible</ThemedText>
        <View style={styles.columnas}>
          {evolucion.map(({ trimestre, base }) => (
            <Columna
              key={etiquetaTrimestre(trimestre)}
              trimestre={trimestre}
              base={base}
              altura={(base / maxEvolucion) * ALTURA_COLUMNA}
              activa={mismoTrimestre(trimestre, seleccionado)}
            />
          ))}
        </View>
      </Tarjeta>
    </Pantalla>
  );
}

function Kpi({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <Tarjeta style={styles.kpi}>
      <ThemedText type="small" themeColor="textSecondary">
        {etiqueta}
      </ThemedText>
      <ThemedText type="default" style={styles.kpiValor}>
        {valor}
      </ThemedText>
    </Tarjeta>
  );
}

function Columna({
  trimestre,
  base,
  altura,
  activa,
}: {
  trimestre: Trimestre;
  base: number;
  altura: number;
  activa: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.columna}>
      <ThemedText
        type="small"
        themeColor={activa ? 'text' : 'textSecondary'}
        style={styles.valorColumna}>
        {base > 0 ? formatearImporte(Math.round(base)).replace(',00', '') : '—'}
      </ThemedText>
      <View
        style={[
          styles.barraVertical,
          {
            height: Math.max(altura, 2),
            backgroundColor: activa ? theme.primary : `${theme.primary}55`,
          },
        ]}
      />
      <ThemedText type="smallBold" themeColor={activa ? 'text' : 'textSecondary'}>
        {etiquetaTrimestre(trimestre).split(' ')[0]}
      </ThemedText>
    </View>
  );
}

function agrupar<T>(lista: T[], clave: (elemento: T) => string) {
  const grupos = new Map<string, T[]>();
  for (const elemento of lista) {
    const k = clave(elemento);
    grupos.set(k, [...(grupos.get(k) ?? []), elemento]);
  }
  return [...grupos.entries()];
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  kpis: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: Spacing.half,
  },
  kpiValor: {
    fontSize: 20,
    fontWeight: 700,
  },
  barraApilada: {
    flexDirection: 'row',
    height: 14,
    gap: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  leyenda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  muestra: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  porcentaje: {
    width: 44,
    textAlign: 'right',
  },
  categoria: {
    gap: Spacing.one,
  },
  pista: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barra: {
    height: '100%',
    borderRadius: 4,
  },
  columnas: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    paddingTop: Spacing.two,
  },
  columna: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  valorColumna: {
    fontSize: 12,
  },
  barraVertical: {
    width: '70%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});
