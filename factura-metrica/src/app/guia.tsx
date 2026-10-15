import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Semaforo } from '@/types/gasto';

interface Entrada {
  titulo: string;
  semaforo: Semaforo;
  texto: string;
}

/** Criterios orientativos para autónomos en estimación directa. No sustituyen al asesor. */
const ENTRADAS: Entrada[] = [
  {
    titulo: 'Material de oficina y herramientas',
    semaforo: 'verde',
    texto:
      'Deducible si se usa en la actividad y tienes factura a tu nombre con tu NIF. Los bienes de más de 300 € pueden tener que amortizarse.',
  },
  {
    titulo: 'Suministros (luz, agua, internet, teléfono)',
    semaforo: 'verde',
    texto:
      'Del local de la actividad, 100 %. Si trabajas desde casa, solo el 30 % de la parte proporcional a los metros afectos a la actividad.',
  },
  {
    titulo: 'Comidas y restaurantes',
    semaforo: 'amarillo',
    texto:
      'Deducibles los gastos de manutención en desplazamientos de trabajo, pagados por medios electrónicos y dentro del límite diario (26,67 € en España sin pernocta). Las comidas con clientes deben poder justificarse con el motivo y la persona.',
  },
  {
    titulo: 'Combustible y vehículo',
    semaforo: 'amarillo',
    texto:
      'El IVA del vehículo y del combustible se presume deducible al 50 %. En el IRPF, solo si el vehículo está afecto en exclusiva a la actividad (salvo transportistas, comerciales y otros casos).',
  },
  {
    titulo: 'Alojamiento y viajes',
    semaforo: 'verde',
    texto:
      'Deducibles si el desplazamiento es por motivo profesional y la factura está a tu nombre. Guarda el motivo del viaje.',
  },
  {
    titulo: 'Tickets sin datos fiscales',
    semaforo: 'amarillo',
    texto:
      'Un ticket (factura simplificada) solo sirve hasta 400 €. Por encima, o para deducir el IVA, pide factura completa con tu nombre y NIF.',
  },
  {
    titulo: 'Multas y sanciones',
    semaforo: 'rojo',
    texto: 'Nunca son deducibles, tampoco los recargos por presentar fuera de plazo.',
  },
  {
    titulo: 'Gastos personales',
    semaforo: 'rojo',
    texto:
      'Ropa de uso cotidiano, ocio, regalos personales o comidas sin relación con la actividad no se pueden deducir.',
  },
];

export default function GuiaScreen() {
  const theme = useTheme();
  const [abierta, setAbierta] = useState<string | null>(ENTRADAS[0].titulo);

  return (
    <Pantalla>
      <ThemedText type="small" themeColor="textSecondary">
        Criterios generales de la LIRPF y de la AEAT para autónomos en estimación directa. Ante
        cualquier duda, consulta con tu asesoría.
      </ThemedText>

      {ENTRADAS.map((entrada) => {
        const expandida = abierta === entrada.titulo;
        const color = theme[entrada.semaforo];
        return (
          <Pressable
            key={entrada.titulo}
            accessibilityRole="button"
            accessibilityState={{ expanded: expandida }}
            onPress={() => setAbierta(expandida ? null : entrada.titulo)}
            style={[styles.entrada, { borderColor: theme.border }]}>
            <View style={styles.cabecera}>
              <View style={[styles.punto, { backgroundColor: color }]} />
              <ThemedText type="smallBold" style={styles.flex}>
                {entrada.titulo}
              </ThemedText>
              <Icono
                ios={expandida ? 'chevron.up' : 'chevron.down'}
                md={expandida ? 'expand_less' : 'expand_more'}
                size={18}
                color={theme.textSecondary}
              />
            </View>
            {expandida && (
              <ThemedText type="small" themeColor="textSecondary">
                {entrada.texto}
              </ThemedText>
            )}
          </Pressable>
        );
      })}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  entrada: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
