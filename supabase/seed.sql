-- Seed de catálogo generado desde Reporte Accel-VPC 14OCT.xlsx
-- Ejecutar DESPUÉS de schema.sql

begin;
insert into public.areas (nombre, orden) values ('Aduana principal', 0) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Aduana principal')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Lavado de manos', 'Tiene los insumos suficientes (cubrebocas, cofias, agua, jabón, gel antibacterial y papel toalla)', 0),
  (NULL, 'Lavado de manos', 'Personal se lava las manos correctamente al entrar', 1),
  (NULL, 'Lavado de manos', 'Puertas cerradas y en buen estado', 2),
  (NULL, 'Instalaciones', 'Se cuenta con despachadores para el lavado y sanitizado de manos en buen estado e identificados', 3)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Aduana reempaque', 1) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Aduana reempaque')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Lavado de manos', 'Tiene los insumos suficientes (cubrebocas, cofias, agua, jabón, gel antibacterial y papel toalla)', 0),
  (NULL, 'Lavado de manos', 'Personal se lava las manos correctamente al entrar', 1),
  (NULL, 'Lavado de manos', 'Puertas cerradas y en buen estado', 2),
  (NULL, 'Instalaciones', 'Se cuenta con despachadores para el lavado y sanitizado de manos en buen estado e identificados', 3)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Andenes', 2) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Andenes')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 9),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 11),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 12),
  (NULL, 'Control de plagas', 'Las lámparas de luz para insectos se encuentran funcionando.', 13),
  (NULL, 'Control de plagas', 'Las trampas mecánicas libres de obstrucciones que eviten su revisión periódica o su correcto funcionamiento.', 14),
  (NULL, 'Control de plagas', 'Todas las trampas se encuentran en buen estado, sin daño ocasionado por el personal del almacén.', 15),
  (NULL, 'Instalaciones', 'Sellos de cortinas y rampas de andén en buen estado y funcionales.', 16),
  (NULL, 'Instalaciones', 'Todas las puertas, cortinas y accesos están cerrados para evitar la entrada de polvo, lluvia o fauna nociva cuando no están en uso. Sin aperturas o huecos hacia el exterior.', 17),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 18),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 19),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado. El techo esta libre de goteras.', 20),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 21),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección y funcionando correctamente.', 22),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Producto o material de empaque se observa limpio, emplayado (cuando aplique) y en buen estado.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines y montacargas se encuentran limpios, en buenas condiciones y en su  área asignada cuando no están en uso operativo', 32),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el producto cerrado, libre de polvo y las cajas en buen estado.', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'El personal no se sienta o caminar sobre estos.', 36)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Cámara 2A', 3) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Cámara 2A')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 9),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas sin producto están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 11),
  (NULL, 'Control de contaminación cruzada', 'Están limpios los tambos de merma, además de que se vacían y lavan con frecuencia.', 12),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 13),
  (NULL, 'Instalaciones', 'Sin aperturas o huecos hacia el exterior.', 14),
  (NULL, 'Instalaciones', 'Se observan hawaianas en buen estado.', 15),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 16),
  (NULL, 'Instalaciones', 'Se observan racks y estructuras (tuberías, canaletas, canastillas, etc.) limpias.', 17),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 18),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado. El techo esta libre de goteras.', 19),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 20),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección.', 21),
  (NULL, 'Instalaciones', 'Las estructuras superiores/techos están libres de pintura descarapelada, exceso de polvo, suciedad, etc.', 22),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el producto y/o material de empaque cerrado, libre de polvo y las cajas en buen estado.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'Área libre de basura o materiales ajenos a la misma. Sin presencia de olores desagradables.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 32),
  (NULL, 'Orden y limpieza en las áreas', 'El área de Merma se observa limpia, ordenada y sin escurrimientos en tambos y básculas.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines y montacargas se encuentran limpios, en buenas condiciones y en su  área asignada cuando no están en uso operativo', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Las tarimas de producto terminado/ materia prima están colocadas de tal forma que exista un espacio entre la pared y las mismas.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 36),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado. No se tienen productos mezclados. No se observan etiquetas despegadas o sueltas.', 37),
  (NULL, 'Orden y limpieza en las áreas', 'Se evita almacenar producto entre pasillos y/o en zonas no establecidas.', 38),
  (NULL, 'Orden y limpieza en las áreas', 'El personal tiene cuidado hacia el producto y materiales. Evita por ejemplo sentarse o caminar sobre estos.', 39)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Cámara 2B', 4) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Cámara 2B')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 9),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas sin producto están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 11),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 12),
  (NULL, 'Instalaciones', 'Sin aperturas o huecos hacia el exterior.', 13),
  (NULL, 'Instalaciones', 'Se observan hawaianas en buen estado.', 14),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 15),
  (NULL, 'Instalaciones', 'Se observan racks y estructuras (tuberías, canaletas, canastillas, etc.) limpias.', 16),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 17),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado. El techo esta libre de goteras.', 18),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 19),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección.', 20),
  (NULL, 'Instalaciones', 'Las estructuras superiores/techos están libres de pintura descarapelada, exceso de polvo, suciedad, etc.', 21),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 22),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el producto y/o material de empaque cerrado, libre de polvo y las cajas en buen estado.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Área libre de basura o materiales ajenos a la misma. Sin presencia de olores desagradables.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines y montacargas se encuentran limpios, en buenas condiciones y en su  área asignada cuando no están en uso operativo', 32),
  (NULL, 'Orden y limpieza en las áreas', 'Las tarimas de producto terminado/ materia prima están colocadas de tal forma que exista un espacio entre la pared y las mismas.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado. No se tienen productos mezclados. No se observan etiquetas despegadas o sueltas.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'Se evita almacenar producto entre pasillos y/o en zonas no establecidas.', 36),
  (NULL, 'Orden y limpieza en las áreas', 'El personal tiene cuidado hacia el producto y materiales. Evita por ejemplo sentarse o caminar sobre estos.', 37)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Cámara 2C', 5) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Cámara 2C')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 9),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas sin producto están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 11),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 12),
  (NULL, 'Instalaciones', 'Sin aperturas o huecos hacia el exterior.', 13),
  (NULL, 'Instalaciones', 'Se observan hawaianas en buen estado.', 14),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 15),
  (NULL, 'Instalaciones', 'Se observan racks y estructuras (tuberías, canaletas, canastillas, etc.) limpias.', 16),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 17),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado. El techo esta libre de goteras.', 18),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 19),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección.', 20),
  (NULL, 'Instalaciones', 'Las estructuras superiores/techos están libres de pintura descarapelada, exceso de polvo, suciedad, etc.', 21),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 22),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el producto y/o material de empaque cerrado, libre de polvo y las cajas en buen estado.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Área libre de basura o materiales ajenos a la misma. Sin presencia de olores desagradables.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines y montacargas se encuentran limpios, en buenas condiciones y en su  área asignada cuando no están en uso operativo', 32),
  (NULL, 'Orden y limpieza en las áreas', 'Las tarimas de producto terminado/ materia prima están colocadas de tal forma que exista un espacio entre la pared y las mismas.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado. No se tienen productos mezclados. No se observan etiquetas despegadas o sueltas.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'Se evita almacenar producto entre pasillos y/o en zonas no establecidas.', 36),
  (NULL, 'Orden y limpieza en las áreas', 'El personal tiene cuidado hacia el producto y materiales. Evita por ejemplo sentarse o caminar sobre estos.', 37)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Reempaque', 6) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Reempaque')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Buenas Prácticas de Higiene', 'El personal se lava y/o sanitiza las manos antes de manipular producto.', 9),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 11),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 12),
  (NULL, 'Control de contaminación cruzada', 'Se respeta el flujo establecido para la entrada de personal y materiales', 13),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 14),
  (NULL, 'Instalaciones', 'Sin aperturas o huecos hacia el exterior.', 15),
  (NULL, 'Instalaciones', 'Se observan hawaianas en buen estado.', 16),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 17),
  (NULL, 'Instalaciones', 'Se observan estructuras (tuberías, canaletas, canastillas, etc.) limpias.', 18),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 19),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado.', 20),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 21),
  (NULL, 'Instalaciones', 'El techo esta libre de goteras.', 22),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan equipos de proceso, básculas y mesas limpias.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'Devoluciones de material no utilizado esta identificado y emplayado.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 32),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines se encuentran limpios, en buenas condiciones y en su área asignada cuando no están en uso operativo', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado. No se tienen productos mezclados. No se observan etiquetas despegadas o sueltas.', 36),
  (NULL, 'Orden y limpieza en las áreas', 'El personal tiene cuidado hacia el producto y materiales. Evita por ejemplo sentarse o caminar sobre estos.', 37)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
insert into public.areas (nombre, orden) values ('Reempaque chico', 7) on conflict (nombre) do nothing;
with a as (select id from public.areas where nombre = 'Reempaque chico')
insert into public.lineamientos (area_id, clasificacion, texto, orden)
select a.id, v.clasif, v.texto, v.ord from a, (values
  (NULL, 'Buenas Prácticas de Higiene', 'Personal porta su cofia y cubrebocas correctamente', 0),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal con barba porta el cubrebarba correctamente', 1),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no porta artículos personales accesorios/ joyería ni adornos en manos, cara incluyendo boca y lengua, orejas, cuello o cabeza como aretes, audífonos, piercings, cadenas, reloj, etc.', 2),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no introduce alimentos y solo se permite el uso de botellas transparentes para tomar agua.', 3),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal usa zapato de seguridad o en su caso chancletas.', 4),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no ingresa medicamentos.', 5),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presenta con uñas recortadas, limpias y sin esmalte.', 6),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal se presentarse aseado al área de trabajo, con ropa y calzado limpios.', 7),
  (NULL, 'Buenas Prácticas de Higiene', 'Personal no estornuda o tose sobre los productos y/o materiales. No escupe en las áreas operativas.', 8),
  (NULL, 'Buenas Prácticas de Higiene', 'El personal se lava y/o sanitiza las manos antes de manipular producto.', 9),
  (NULL, 'Control de contaminación cruzada', 'Se observan objetos punzocortantes en buen estado y controlados. No se observan vidrios, lámparas, micas u otro material quebrado o en malas condiciones.', 10),
  (NULL, 'Control de contaminación cruzada', 'No se observan químicos sin identificar. Se observan resguardados correctamente y en buenas condiciones.', 11),
  (NULL, 'Control de contaminación cruzada', 'Las tarimas están libres de astillas, componentes faltantes o en posición inadecuada, clavos expuestos, contaminación por químicos o evidencia de plagas.', 12),
  (NULL, 'Control de contaminación cruzada', 'Se respeta el flujo establecido para la entrada de personal y materiales', 13),
  (NULL, 'Control de plagas', 'No existe evidencia de actividad de plagas.', 14),
  (NULL, 'Instalaciones', 'Sin aperturas o huecos hacia el exterior.', 15),
  (NULL, 'Instalaciones', 'Se observan hawaianas en buen estado.', 16),
  (NULL, 'Instalaciones', 'No se observa presencia de condensados y/o escurrimientos de agua en techos y paredes.', 17),
  (NULL, 'Instalaciones', 'Se observan estructuras (tuberías, canaletas, canastillas, etc.) limpias.', 18),
  (NULL, 'Instalaciones', 'No se observan arreglos temporales (amarres con playo, cintas, etc.)', 19),
  (NULL, 'Instalaciones', 'Las estructuras superiores se encuentran en buen estado.', 20),
  (NULL, 'Instalaciones', 'El piso y las paredes se encuentra en buen estado, libre de hoyos y grietas.', 21),
  (NULL, 'Instalaciones', 'El techo esta libre de goteras.', 22),
  (NULL, 'Instalaciones', 'Las instalaciones cuentan con iluminación adecuada para realizar sus actividades. Las lámparas se encuentran con protección.', 23),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan tarimas vacías y fuera del lugar asignado.', 24),
  (NULL, 'Orden y limpieza en las áreas', 'Los contenedores de basura se encuentran limpios, libres de olor y es retirada frecuentemente la basura de las áreas.', 25),
  (NULL, 'Orden y limpieza en las áreas', 'Tarimas que contienen producto se observan en buenas condiciones.', 26),
  (NULL, 'Orden y limpieza en las áreas', 'Se observa el área limpia y sin restos de basura o pedazos de tarimas en piso.', 27),
  (NULL, 'Orden y limpieza en las áreas', 'No se observan etiquetas de lotificado sueltas o en malas condiciones.', 28),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan pisos y paredes limpias.', 29),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan equipos de proceso, básculas y mesas limpias.', 30),
  (NULL, 'Orden y limpieza en las áreas', 'Devoluciones de material no utilizado esta identificado y emplayado.', 31),
  (NULL, 'Orden y limpieza en las áreas', 'No hay evidencia de derrame de líquidos  y/o cualquier otro contaminante.', 32),
  (NULL, 'Orden y limpieza en las áreas', 'No se colocan a nivel piso productos como cajas de producto y/o materiales.', 33),
  (NULL, 'Orden y limpieza en las áreas', 'Los patines se encuentran limpios, en buenas condiciones y en su área asignada cuando no están en uso operativo', 34),
  (NULL, 'Orden y limpieza en las áreas', 'Se observan utensilios de limpieza solo en las áreas asignadas. Se utilizan de acuerdo al código de colores.', 35),
  (NULL, 'Orden y limpieza en las áreas', 'Todo el producto se encuentra plenamente identificado. No se tienen productos mezclados. No se observan etiquetas despegadas o sueltas.', 36),
  (NULL, 'Orden y limpieza en las áreas', 'El personal tiene cuidado hacia el producto y materiales. Evita por ejemplo sentarse o caminar sobre estos.', 37)
) as v(a_id_dummy, clasif, texto, ord)
where true
on conflict (area_id, clasificacion, texto) do nothing;
commit;
