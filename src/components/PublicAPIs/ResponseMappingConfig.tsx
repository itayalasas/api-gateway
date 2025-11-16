import { useState } from 'react';
import { Plus, Trash2, Code, AlertCircle, Check } from 'lucide-react';

interface ResponseMappingConfigProps {
  value: any;
  onChange: (value: any) => void;
}

export function ResponseMappingConfig({ value, onChange }: ResponseMappingConfigProps) {
  const [enabled, setEnabled] = useState(value?.enabled || false);
  const [templateJson, setTemplateJson] = useState(
    value?.template ? JSON.stringify(value.template, null, 2) : ''
  );
  const [transformations, setTransformations] = useState<Array<{ field: string; expression: string }>>(
    value?.transformations || []
  );
  const [templateError, setTemplateError] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    updateValue({ enabled: checked, template: value?.template, transformations });
  };

  const handleTemplateChange = (newTemplate: string) => {
    setTemplateJson(newTemplate);
    setTemplateError('');

    if (!newTemplate.trim()) {
      updateValue({ enabled, template: null, transformations });
      return;
    }

    try {
      const parsed = JSON.parse(newTemplate);
      updateValue({ enabled, template: parsed, transformations });
    } catch (err) {
      setTemplateError('JSON inválido');
    }
  };

  const handleAddTransformation = () => {
    const newTransformations = [...transformations, { field: '', expression: '' }];
    setTransformations(newTransformations);
    updateValue({ enabled, template: value?.template, transformations: newTransformations });
  };

  const handleRemoveTransformation = (index: number) => {
    const newTransformations = transformations.filter((_, i) => i !== index);
    setTransformations(newTransformations);
    updateValue({ enabled, template: value?.template, transformations: newTransformations });
  };

  const handleTransformationChange = (index: number, field: string, expression: string) => {
    const newTransformations = [...transformations];
    newTransformations[index] = { field, expression };
    setTransformations(newTransformations);
    updateValue({ enabled, template: value?.template, transformations: newTransformations });
  };

  const updateValue = (newValue: any) => {
    onChange(newValue);
  };

  const exampleTemplate = {
    flags: {
      png: '${response.flags.png}',
      svg: '${response.flags.svg}',
    },
    idd: '${response.idd}',
  };

  const exampleOriginalResponse = [
    {
      flags: {
        png: 'https://flagcdn.com/w320/sy.png',
        svg: 'https://flagcdn.com/sy.svg',
        alt: 'The flag of Syria...',
      },
      name: {
        common: 'Syria',
        official: 'Syrian Arab Republic',
      },
      idd: {
        root: '+9',
        suffixes: ['63'],
      },
    },
  ];

  const exampleMappedResponse = [
    {
      flags: {
        png: 'https://flagcdn.com/w320/sy.png',
        svg: 'https://flagcdn.com/sy.svg',
      },
      idd: {
        root: '+9',
        suffixes: ['63'],
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => handleEnabledChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-300">
              Habilitar Mapeo de Respuestas
            </span>
          </label>
        </div>
        <button
          type="button"
          onClick={() => setShowExamples(!showExamples)}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          {showExamples ? 'Ocultar' : 'Ver'} ejemplos
        </button>
      </div>

      {showExamples && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-blue-400">Cómo funciona:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Define un template JSON con la estructura de salida deseada</li>
                <li>Usa la sintaxis <code className="bg-slate-800 px-1 rounded">{'${response.campo}'}</code> para extraer valores</li>
                <li>Soporta campos anidados: <code className="bg-slate-800 px-1 rounded">{'${response.flags.png}'}</code></li>
                <li>Soporta arrays: <code className="bg-slate-800 px-1 rounded">{'${response.idd.suffixes[0]}'}</code></li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Respuesta Original:</p>
            <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(exampleOriginalResponse, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400">Template de Mapeo:</p>
            <pre className="bg-slate-800 rounded p-2 text-xs text-slate-300 overflow-x-auto">
              {JSON.stringify(exampleTemplate, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-green-400">Respuesta Mapeada:</p>
            <pre className="bg-slate-800 rounded p-2 text-xs text-green-300 overflow-x-auto">
              {JSON.stringify(exampleMappedResponse, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {enabled && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Template JSON
            </label>
            <div className="relative">
              <textarea
                value={templateJson}
                onChange={(e) => handleTemplateChange(e.target.value)}
                placeholder={JSON.stringify(exampleTemplate, null, 2)}
                rows={12}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
              />
              {templateJson && !templateError && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-600/20 border border-green-600/30 rounded px-2 py-1 flex items-center gap-1">
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Válido</span>
                  </div>
                </div>
              )}
            </div>
            {templateError && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {templateError}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Define la estructura de la respuesta mapeada usando sintaxis {'${response.campo}'}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">
                Transformaciones (Opcional)
              </label>
              <button
                type="button"
                onClick={handleAddTransformation}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Agregar
              </button>
            </div>

            {transformations.length > 0 && (
              <div className="space-y-2">
                {transformations.map((transform, index) => (
                  <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        Transformación {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTransformation(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Campo</label>
                        <input
                          type="text"
                          value={transform.field}
                          onChange={(e) =>
                            handleTransformationChange(index, e.target.value, transform.expression)
                          }
                          placeholder="ej. full_phone"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Expresión</label>
                        <input
                          type="text"
                          value={transform.expression}
                          onChange={(e) =>
                            handleTransformationChange(index, transform.field, e.target.value)
                          }
                          placeholder="ej. ${response.idd.root}${response.idd.suffixes[0]}"
                          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 mt-2">
              Las transformaciones permiten concatenar valores y crear nuevos campos
            </p>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-100">
                <p className="font-semibold mb-1">Nota importante:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Si no se configura, se devuelve la respuesta original sin cambios</li>
                  <li>Los errores en el mapeo no afectan la respuesta, se devuelve el original</li>
                  <li>El mapeo se aplica tanto a objetos individuales como a arrays</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
