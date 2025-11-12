import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

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

  const activeSheet = sheets.find(s => s.id === activeSheetId)!;

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

  const totalAmount = activeSheet.rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

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
            <div className="flex items-center justify-between border-b bg-slate-50/50 px-6 py-3">
              <TabsList className="bg-white">
                {sheets.map(sheet => (
                  <div key={sheet.id} className="flex items-center group">
                    <TabsTrigger value={sheet.id} className="relative">
                      {sheet.name}
                    </TabsTrigger>
                    {sheets.length > 1 && (
                      <button
                        onClick={() => deleteSheet(sheet.id)}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Icon name="X" size={14} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </TabsList>
              <Button onClick={addSheet} variant="ghost" size="sm" className="gap-2">
                <Icon name="Plus" size={16} />
                Новый лист
              </Button>
            </div>

            {sheets.map(sheet => (
              <TabsContent key={sheet.id} value={sheet.id} className="p-6 space-y-4">
                <div className="overflow-x-auto">
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
                      {sheet.rows.map((row, index) => (
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
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <Button onClick={addRow} className="gap-2 w-full md:w-auto">
                  <Icon name="Plus" size={16} />
                  Добавить строку
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Index;
