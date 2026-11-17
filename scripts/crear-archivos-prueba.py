"""Crea los archivos de prueba de la carga de Excel (pruebas/archivos/).

Todo es inventado: entidades ficticias y cifras escritas a mano. Se corre una
vez y los archivos quedan en el repositorio; las pruebas no necesitan Python.

    python3 scripts/crear-archivos-prueba.py

Necesita openpyxl (pip install openpyxl) y, para las versiones guardadas por
LibreOffice (.xlsx recalculado, .xls y .ods), el programa `soffice`.
"""

import datetime as dt
import os
import shutil
import subprocess
import tempfile

from openpyxl import Workbook
from openpyxl.styles import Font

CARPETA = os.path.join(os.path.dirname(__file__), '..', 'pruebas', 'archivos')

ENTIDADES = [
    ('Fondo Ejemplo', 0.1373, 412, 52_340),
    ('Cooperativa Uno', 0.1521, 318, 40_115),
    ('Banco Ficticio', 0.1479, 1_204, 160_870),
    ('Caja Inventada', 0.1610, 95, 11_200),
]


def libro_mes(ruta, mes_extra=False):
    wb = Workbook()
    hoja = wb.active
    hoja.title = 'Resumen'
    hoja['A1'] = 'Benchmarking de tasas (datos inventados)'
    hoja['A1'].font = Font(bold=True, size=14)
    # Mes siguiente: los encabezados bajan una fila y cambian de orden.
    fila = 4 if mes_extra else 3
    if mes_extra:
        encabezados = ['Monto', 'Entidad', 'Tasa', 'Desembolsos', 'Fecha corte', 'Tasa', '', 'Cálculo']
    else:
        encabezados = ['Entidad', 'Tasa', 'Desembolsos', 'Monto', 'Fecha corte', 'Tasa', '', 'Cálculo']
    for j, texto in enumerate(encabezados, start=1):
        if texto:
            hoja.cell(row=fila, column=j, value=texto)
    filas = ENTIDADES + ([('Mutual Prueba', 0.1555, 60, 7_400)] if mes_extra else [])
    for i, (entidad, tasa, desembolsos, monto) in enumerate(filas, start=fila + 1):
        valores = {
            'Entidad': entidad,
            'Tasa': tasa,
            'Desembolsos': desembolsos,
            'Monto': monto,
            'Fecha corte': dt.date(2026, 11 if mes_extra else 10, 30 if mes_extra else 31),
        }
        for j, texto in enumerate(encabezados, start=1):
            if texto in valores and j < 6:
                celda = hoja.cell(row=i, column=j, value=valores[texto])
                if texto == 'Tasa':
                    celda.number_format = '0.00%'
                elif texto == 'Monto':
                    celda.number_format = '"$"#,##0'
                elif texto == 'Desembolsos':
                    celda.number_format = '#,##0'
                elif texto == 'Fecha corte':
                    celda.number_format = 'dd/mm/yyyy'
        # Segunda columna "Tasa" (repetida): la tasa efectiva, sin formato.
        hoja.cell(row=i, column=6, value=round(tasa + 0.01, 4))
        # Columna sin encabezado con datos.
        hoja.cell(row=i, column=7, value=f'Nota {i - fila}')
        # Fórmula: openpyxl no guarda el valor calculado (queda vacía al leer).
        hoja.cell(row=i, column=8, value=f'=B{i}*100')
    ultima = fila + len(filas)
    hoja.cell(row=ultima + 2, column=1, value='Fuente: datos inventados para pruebas.')

    serie = wb.create_sheet('Serie')
    serie.append(['Mes', 'REPO', 'IBR', 'Comentario'])
    for k in range(14):
        anio, mes = divmod(9 + k, 12)
        fecha = dt.date(2025 + anio, mes + 1, 1)
        serie.append([fecha, 0.095 - k * 0.001, 0.0929 - k * 0.0012, 'ok' if k % 2 else None])
        serie.cell(row=k + 2, column=1).number_format = 'mmm-yy'
        serie.cell(row=k + 2, column=2).number_format = '0.00%'
        serie.cell(row=k + 2, column=3).number_format = '0.00%'

    oculta = wb.create_sheet('Oculta')
    oculta['A1'] = 'No mostrar'
    oculta.sheet_state = 'hidden'
    wb.save(ruta)


def con_libreoffice(origen, formato, destino):
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(['soffice', '--headless', '--convert-to', formato, '--outdir', tmp, origen], check=True, capture_output=True)
        nombre = [f for f in os.listdir(tmp)][0]
        shutil.move(os.path.join(tmp, nombre), destino)


def csv_windows(ruta):
    lineas = [
        'Compañía;Tasa;Desembolsos;Monto',
        'Fondo Ejemplo;13,73%;412;$ 52.340',
        'Cooperativa Uno;15,21%;318;$ 40.115',
        '"Banco; Ficticio";14,79%;1.204;$ 160.870',
        'Caja Inventada;n.d.;95;$ 11.200',
    ]
    with open(ruta, 'w', encoding='cp1252', newline='') as f:
        f.write('\r\n'.join(lineas) + '\r\n')


if __name__ == '__main__':
    os.makedirs(CARPETA, exist_ok=True)
    mes1 = os.path.join(CARPETA, 'tasas-octubre.xlsx')
    mes2 = os.path.join(CARPETA, 'tasas-noviembre.xlsx')
    libro_mes(mes1)
    libro_mes(mes2, mes_extra=True)
    # LibreOffice recalcula las fórmulas y escribe el XML a su manera.
    con_libreoffice(mes1, 'xlsx:Calc MS Excel 2007 XML', os.path.join(CARPETA, 'tasas-octubre-libreoffice.xlsx'))
    con_libreoffice(mes1, 'xls:MS Excel 97', os.path.join(CARPETA, 'tasas-octubre.xls'))
    con_libreoffice(mes1, 'ods', os.path.join(CARPETA, 'tasas-octubre.ods'))
    csv_windows(os.path.join(CARPETA, 'tasas-octubre.csv'))
    print('Listo:', sorted(os.listdir(CARPETA)))
