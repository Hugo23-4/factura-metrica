import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Boton } from '@/components/boton';
import { Avatar } from '@/components/cabecera-usuario';
import { Chips } from '@/components/chips';
import { Icono } from '@/components/icono';
import { Pantalla } from '@/components/pantalla';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useGastosVisibles } from '@/context/gastos-context';
import { useClientesAsesoria, useSesion } from '@/context/sesion-context';
import { useTheme } from '@/hooks/use-theme';
import { estadoDe } from '@/services/estado-gasto';

type Filtro = 'todos' | 'activos' | 'pausados';

/** RF-14: cartera de clientes de la asesoría (listado del CRUD). */
export default function ClientesScreen() {
  const theme = useTheme();
  const { usuarios } = useSesion();
  const clientes = useClientesAsesoria();
  const gastos = useGastosVisibles();
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const texto = busqueda.trim().toLowerCase();
  const visibles = clientes
    .filter((c) => filtro === 'todos' || (filtro === 'activos' ? c.activo : !c.activo))
    .filter(
      (c) =>
        !texto ||
        c.nombre.toLowerCase().includes(texto) ||
        c.nif.toLowerCase().includes(texto) ||
        c.email.includes(texto),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <Pantalla
      enPestana
      titulo="Clientes"
      antetitulo={`${clientes.length} autónomos en cartera`}
      accion={
        <Boton
          titulo="Nuevo"
          onPress={() => router.push('/admin/cliente-formulario')}
          style={styles.nuevo}
        />
      }>
      <View style={[styles.buscador, { backgroundColor: theme.backgroundElement }]}>
        <Icono ios="magnifyingglass" md="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por nombre, NIF o correo"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }]}
        />
      </View>
      <Chips
        opciones={[
          { valor: 'todos', etiqueta: 'Todos' },
          { valor: 'activos', etiqueta: 'Activos' },
          { valor: 'pausados', etiqueta: 'Pausados' },
        ]}
        valor={filtro}
        onCambio={setFiltro}
      />

      {visibles.map((cliente) => {
        const suyos = gastos.filter((g) => g.clienteId === cliente.id);
        const porRevisar = suyos.filter((g) => estadoDe(g) === 'justificado').length;
        const gestor = usuarios.find((u) => u.id === cliente.gestorId);
        return (
          <Pressable
            key={cliente.id}
            onPress={() =>
              router.push({ pathname: '/admin/cliente/[id]', params: { id: cliente.id } })
            }
            style={({ pressed }) => [
              styles.item,
              { borderColor: theme.border },
              pressed && styles.pulsado,
            ]}>
            <Avatar nombre={cliente.nombre} size={44} />
            <View style={styles.flex}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {cliente.nombre}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {cliente.nif} · {gestor?.nombre ?? 'Sin gestor'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {suyos.length} gastos
                {porRevisar > 0 && (
                  <ThemedText type="small" style={{ color: theme.amarillo }}>
                    {' '}
                    · {porRevisar} por revisar
                  </ThemedText>
                )}
              </ThemedText>
            </View>
            {!cliente.activo && (
              <View style={[styles.etiqueta, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.textoEtiqueta}>
                  Pausado
                </ThemedText>
              </View>
            )}
            <Icono ios="chevron.right" md="chevron_right" size={18} color={theme.textSecondary} />
          </Pressable>
        );
      })}

      {visibles.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.vacio}>
          No hay clientes que coincidan con la búsqueda.
        </ThemedText>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  nuevo: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  input: {
    flex: 1,
    minHeight: 46,
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  etiqueta: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  textoEtiqueta: {
    fontSize: 12,
  },
  pulsado: {
    opacity: 0.7,
  },
  vacio: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
