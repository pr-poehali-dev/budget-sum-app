import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

interface ExpenseRow {
  id: string;
  date: string;
  amount: number;
  reason: string;
}

interface Sheet {
  id: string;
  name: string;
  rows: ExpenseRow[];
}

type FilterPeriod = 'all' | 'today' | 'week' | 'month' | 'custom';

const Index = () => {
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: '1',
      name: 'Лист 1',
      rows: [
        { id: '1', date: new Date().toISOString().split('T')[0], amount: 0, reason: '' }
      ]
    }
  ]);
  const [activeSheetId, setActiveSheetId] = useState('1');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [sheetToRename, setSheetToRename] = useState<string | null>(null);
  const [newSheetName, setNewSheetName] = useState('');

  const activeSheet = sheets.find(s => s.id === activeSheetId)!;

  const getFilterDates = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (filterPeriod) {
      case 'today':
        return { from: todayStr, to: todayStr };
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return { from: weekAgo.toISOString().split('T')[0], to: todayStr };
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return { from: monthAgo.toISOString().split('T')[0], to: todayStr };
      }
      case 'custom':
        return { from: customDateFrom, to: customDateTo };
      default:
        return null;
    }
  };

  const filteredRows = useMemo(() => {
    const dates = getFilterDates();
    if (!dates || !dates.from || !dates.to) return activeSheet.rows;

    return activeSheet.rows.filter(row => {
      return row.date >= dates.from && row.date <= dates.to;
    });
  }, [activeSheet.rows, filterPeriod, customDateFrom, customDateTo]);

  const totalAmount = filteredRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const totalCount = filteredRows.length;
  const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

  const addRow = () => {
    setSheets(sheets.map(sheet => 
      sheet.id === activeSheetId 
        ? {
            ...sheet,
            rows: [
              ...sheet.rows,
              { 
                id: Date.now().toString(), 
                date: new Date().toISOString().split('T')[0], 
                amount: 0, 
                reason: '' 
              }
            ]
          }
        : sheet
    ));
  };

  const deleteRow = (rowId: string) => {
    setSheets(sheets.map(sheet => 
      sheet.id === activeSheetId 
        ? { ...sheet, rows: sheet.rows.filter(row => row.id !== rowId) }
        : sheet
    ));
  };

  const updateRow = (rowId: string, field: keyof ExpenseRow, value: string | number) => {
    setSheets(sheets.map(sheet => 
      sheet.id === activeSheetId 
        ? {
            ...sheet,
            rows: sheet.rows.map(row => 
              row.id === rowId ? { ...row, [field]: value } : row
            )
          }
        : sheet
    ));
  };

  const addSheet = () => {
    const newId = (sheets.length + 1).toString();
    setSheets([
      ...sheets,
      {
        id: newId,
        name: `Лист ${newId}`,
        rows: [{ id: '1', date: new Date().toISOString().split('T')[0], amount: 0, reason: '' }]
      }
    ]);
    setActiveSheetId(newId);
  };

  const deleteSheet = (sheetId: string) => {
    if (sheets.length === 1) return;
    const newSheets = sheets.filter(s => s.id !== sheetId);
    setSheets(newSheets);
    if (activeSheetId === sheetId) {
      setActiveSheetId(newSheets[0].id);
    }
  };

  const openRenameDialog = (sheetId: string) => {
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet) {
      setSheetToRename(sheetId);
      setNewSheetName(sheet.name);
      setRenameDialogOpen(true);
    }
  };

  const renameSheet = () => {
    if (!sheetToRename || !newSheetName.trim()) return;
    
    setSheets(sheets.map(sheet => 
      sheet.id === sheetToRename 
        ? { ...sheet, name: newSheetName.trim() }
        : sheet
    ));
    
    setRenameDialogOpen(false);
    setSheetToRename(null);
    setNewSheetName('');
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      const dataToExport = sheet.rows.map(row => ({
        'Дата': row.date,
        'Сумма (₽)': row.amount,
        'Причина траты': row.reason
      }));

      const sheetTotal = sheet.rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      dataToExport.push({
        'Дата': 'ИТОГО:',
        'Сумма (₽)': sheetTotal,
        'Причина траты': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      
      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 15 },
        { wch: 40 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    const fileName = `Расходы_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">
            Учет расходов
          </h1>
          <p className="text-muted-foreground text-lg">
            Простое и удобное управление финансами
          </p>
        </div>

        <Card className="shadow-lg animate-scale-in">
          <Tabs value={activeSheetId} onValueChange={setActiveSheetId}>
            <div className="flex items-center justify-between border-b bg-slate-50/50 px-6 py-3 flex-wrap gap-3">
              <TabsList className="bg-white">
                {sheets.map(sheet => (
                  <div key={sheet.id} className="flex items-center group">
                    <TabsTrigger value={sheet.id} className="relative">
                      {sheet.name}
                    </TabsTrigger>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameDialog(sheet.id);
                      }}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Переименовать"
                    >
                      <Icon name="Pencil" size={14} className="text-muted-foreground hover:text-primary" />
                    </button>
                    {sheets.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSheet(sheet.id);
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Удалить"
                      >
                        <Icon name="X" size={14} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </TabsList>
              <div className="flex gap-2">
                <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2">
                  <Icon name="Download" size={16} />
                  Экспорт в Excel
                </Button>
                <Button onClick={addSheet} variant="ghost" size="sm" className="gap-2">
                  <Icon name="Plus" size={16} />
                  Новый лист
                </Button>
              </div>
            </div>

            {sheets.map(sheet => (
              <TabsContent key={sheet.id} value={sheet.id} className="p-6 space-y-6">
                <div className="bg-slate-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="Filter" size={18} className="text-primary" />
                    <h3 className="font-semibold text-foreground">Фильтр по датам</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={filterPeriod === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPeriod('all')}
                    >
                      Все время
                    </Button>
                    <Button
                      variant={filterPeriod === 'today' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPeriod('today')}
                    >
                      Сегодня
                    </Button>
                    <Button
                      variant={filterPeriod === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPeriod('week')}
                    >
                      Неделя
                    </Button>
                    <Button
                      variant={filterPeriod === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPeriod('month')}
                    >
                      Месяц
                    </Button>
                    <Button
                      variant={filterPeriod === 'custom' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterPeriod('custom')}
                    >
                      Свой период
                    </Button>
                  </div>

                  {filterPeriod === 'custom' && (
                    <div className="flex flex-wrap gap-3 items-center animate-fade-in">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">С:</span>
                        <Input
                          type="date"
                          value={customDateFrom}
                          onChange={(e) => setCustomDateFrom(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">По:</span>
                        <Input
                          type="date"
                          value={customDateTo}
                          onChange={(e) => setCustomDateTo(e.target.value)}
                          className="w-auto"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Wallet" size={16} className="text-primary" />
                        <p className="text-sm text-muted-foreground">Общая сумма</p>
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {totalAmount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="Hash" size={16} className="text-primary" />
                        <p className="text-sm text-muted-foreground">Количество</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {totalCount}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon name="TrendingUp" size={16} className="text-primary" />
                        <p className="text-sm text-muted-foreground">Средний чек</p>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {averageAmount.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} ₽
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {filteredRows.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Icon name="SearchX" size={48} className="mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Нет расходов за выбранный период</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="text-left py-3 px-4 font-semibold text-foreground bg-slate-50">
                            Дата
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground bg-slate-50">
                            Сумма (₽)
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground bg-slate-50">
                            Причина траты
                          </th>
                          <th className="w-12 bg-slate-50"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row, index) => (
                          <tr 
                            key={row.id} 
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="py-2 px-4">
                              <Input
                                type="date"
                                value={row.date}
                                onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                                className="border-slate-200 focus:border-primary"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <Input
                                type="number"
                                value={row.amount || ''}
                                onChange={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="border-slate-200 focus:border-primary"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <Input
                                type="text"
                                value={row.reason}
                                onChange={(e) => updateRow(row.id, 'reason', e.target.value)}
                                placeholder="Введите причину..."
                                className="border-slate-200 focus:border-primary"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRow(row.id)}
                                disabled={sheet.rows.length === 1}
                                className="hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Icon name="Trash2" size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-primary/5">
                          <td className="py-4 px-4 font-semibold text-foreground">
                            ИТОГО:
                          </td>
                          <td className="py-4 px-4 font-bold text-xl text-primary">
                            {totalAmount.toLocaleString('ru-RU')} ₽
                          </td>
                          <td colSpan={2}>
                            {filterPeriod !== 'all' && (
                              <Badge variant="secondary" className="ml-2">
                                Показано: {totalCount} из {sheet.rows.length}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  )}
                </div>

                <Button onClick={addRow} className="gap-2 w-full md:w-auto">
                  <Icon name="Plus" size={16} />
                  Добавить строку
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </Card>

        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Переименовать лист</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={newSheetName}
                onChange={(e) => setNewSheetName(e.target.value)}
                placeholder="Введите название листа"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameSheet();
                  }
                }}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={renameSheet} disabled={!newSheetName.trim()}>
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Index;