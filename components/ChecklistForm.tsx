"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ClipboardCheck } from "lucide-react";
import {
  InspectionChecklist,
  defaultChecklist,
  QualityLevel,
  FluidLevel,
  qualityLevelLabels,
  fluidLevelLabels,
} from "@/lib/types";

interface ChecklistFormProps {
  checklist: InspectionChecklist;
  onChecklistChange: (checklist: InspectionChecklist) => void;
}

export default function ChecklistForm({
  checklist,
  onChecklistChange,
}: ChecklistFormProps) {
  const [openSections, setOpenSections] = useState<string[]>(["carrosserie"]);

  const toggleSection = (section: string) => {
    if (openSections.includes(section)) {
      setOpenSections(openSections.filter((s) => s !== section));
    } else {
      setOpenSections([...openSections, section]);
    }
  };

  const updateChecklist = (
    section: keyof InspectionChecklist,
    field: string,
    value: any
  ) => {
    onChecklistChange({
      ...checklist,
      [section]: {
        ...checklist[section],
        [field]: value,
      },
    });
  };

  const QualitySelect = ({
    value,
    onChange,
  }: {
    value: QualityLevel;
    onChange: (value: QualityLevel) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as QualityLevel)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
    >
      {(Object.keys(qualityLevelLabels) as QualityLevel[]).map((level) => (
        <option key={level} value={level}>
          {qualityLevelLabels[level]}
        </option>
      ))}
    </select>
  );

  const FluidSelect = ({
    value,
    onChange,
  }: {
    value: FluidLevel;
    onChange: (value: FluidLevel) => void;
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as FluidLevel)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
    >
      {(Object.keys(fluidLevelLabels) as FluidLevel[]).map((level) => (
        <option key={level} value={level}>
          {fluidLevelLabels[level]}
        </option>
      ))}
    </select>
  );

  const Section = ({
    id,
    title,
    icon,
    children,
  }: {
    id: string;
    title: string;
    icon: string;
    children: React.ReactNode;
  }) => {
    const isOpen = openSections.includes(id);

    return (
      <div className="border rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{icon}</span>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isOpen && <div className="p-4 bg-white space-y-4">{children}</div>}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <ClipboardCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Checklist d'inspection
          </h2>
          <p className="text-sm text-gray-600">
            Remplissez tous les champs avec attention
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* 🚗 CARROSSERIE */}
        <Section id="carrosserie" title="Carrosserie" icon="🚗">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={checklist.carrosserie.rayures}
                  onChange={(e) =>
                    updateChecklist("carrosserie", "rayures", e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Rayures présentes
                </span>
              </label>
              {checklist.carrosserie.rayures && (
                <textarea
                  value={checklist.carrosserie.rayuresDetails || ""}
                  onChange={(e) =>
                    updateChecklist(
                      "carrosserie",
                      "rayuresDetails",
                      e.target.value
                    )
                  }
                  placeholder="Décrivez les rayures..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={checklist.carrosserie.bosses}
                  onChange={(e) =>
                    updateChecklist("carrosserie", "bosses", e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Bosses présentes
                </span>
              </label>
              {checklist.carrosserie.bosses && (
                <textarea
                  value={checklist.carrosserie.bossesDetails || ""}
                  onChange={(e) =>
                    updateChecklist(
                      "carrosserie",
                      "bossesDetails",
                      e.target.value
                    )
                  }
                  placeholder="Décrivez les bosses..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État de la peinture
              </label>
              <QualitySelect
                value={checklist.carrosserie.peinture}
                onChange={(value) =>
                  updateChecklist("carrosserie", "peinture", value)
                }
              />
            </div>

            {checklist.carrosserie.peinture !== "excellent" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Détails peinture
                </label>
                <textarea
                  value={checklist.carrosserie.peintureDetails || ""}
                  onChange={(e) =>
                    updateChecklist(
                      "carrosserie",
                      "peintureDetails",
                      e.target.value
                    )
                  }
                  placeholder="Décrivez l'état de la peinture..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>
            )}
          </div>
        </Section>

        {/* ⚙️ MÉCANIQUE */}
        <Section id="mecanique" title="Mécanique" icon="⚙️">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Moteur
              </label>
              <QualitySelect
                value={checklist.mecanique.moteur}
                onChange={(value) =>
                  updateChecklist("mecanique", "moteur", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Freins
              </label>
              <QualitySelect
                value={checklist.mecanique.freins}
                onChange={(value) =>
                  updateChecklist("mecanique", "freins", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suspension
              </label>
              <QualitySelect
                value={checklist.mecanique.suspension}
                onChange={(value) =>
                  updateChecklist("mecanique", "suspension", value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Autres problèmes mécaniques
              </label>
              <textarea
                value={checklist.mecanique.autresProblemes || ""}
                onChange={(e) =>
                  updateChecklist(
                    "mecanique",
                    "autresProblemes",
                    e.target.value
                  )
                }
                placeholder="Décrivez les éventuels problèmes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows={2}
              />
            </div>
          </div>
        </Section>

        {/* 🪑 INTÉRIEUR */}
        <Section id="interieur" title="Intérieur" icon="🪑">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sièges
              </label>
              <QualitySelect
                value={checklist.interieur.sieges}
                onChange={(value) =>
                  updateChecklist("interieur", "sieges", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tableau de bord
              </label>
              <QualitySelect
                value={checklist.interieur.tableauBord}
                onChange={(value) =>
                  updateChecklist("interieur", "tableauBord", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Propreté
              </label>
              <QualitySelect
                value={checklist.interieur.proprete}
                onChange={(value) =>
                  updateChecklist("interieur", "proprete", value)
                }
              />
            </div>

            <div className="md:col-span-3">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={checklist.interieur.odeur}
                  onChange={(e) =>
                    updateChecklist("interieur", "odeur", e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Odeur particulière (tabac, animaux, etc.)
                </span>
              </label>
              {checklist.interieur.odeur && (
                <textarea
                  value={checklist.interieur.odeurDetails || ""}
                  onChange={(e) =>
                    updateChecklist("interieur", "odeurDetails", e.target.value)
                  }
                  placeholder="Décrivez l'odeur..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              )}
            </div>
          </div>
        </Section>

        {/* 🛞 PNEUS */}
        <Section id="pneus" title="Pneus" icon="🛞">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avant Gauche
              </label>
              <QualitySelect
                value={checklist.pneus.avantGauche}
                onChange={(value) =>
                  updateChecklist("pneus", "avantGauche", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Avant Droit
              </label>
              <QualitySelect
                value={checklist.pneus.avantDroit}
                onChange={(value) =>
                  updateChecklist("pneus", "avantDroit", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrière Gauche
              </label>
              <QualitySelect
                value={checklist.pneus.arriereGauche}
                onChange={(value) =>
                  updateChecklist("pneus", "arriereGauche", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrière Droit
              </label>
              <QualitySelect
                value={checklist.pneus.arriereDroit}
                onChange={(value) =>
                  updateChecklist("pneus", "arriereDroit", value)
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={checklist.pneus.roueSecours}
                  onChange={(e) =>
                    updateChecklist("pneus", "roueSecours", e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Roue de secours présente et en bon état
                </span>
              </label>
            </div>
          </div>
        </Section>

        {/* ⛽ NIVEAUX */}
        <Section id="niveaux" title="Niveaux" icon="⛽">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de carburant (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={checklist.niveaux.carburant}
                  onChange={(e) =>
                    updateChecklist(
                      "niveaux",
                      "carburant",
                      parseInt(e.target.value)
                    )
                  }
                  className="flex-1"
                />
                <span className="text-lg font-semibold text-green-600 w-12">
                  {checklist.niveaux.carburant}%
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kilométrage
              </label>
              <input
                type="number"
                value={checklist.niveaux.kilometrage}
                onChange={(e) =>
                  updateChecklist(
                    "niveaux",
                    "kilometrage",
                    parseInt(e.target.value) || 0
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Huile moteur
              </label>
              <FluidSelect
                value={checklist.niveaux.huile}
                onChange={(value) => updateChecklist("niveaux", "huile", value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liquide de refroidissement
              </label>
              <FluidSelect
                value={checklist.niveaux.liquideRefroidissement}
                onChange={(value) =>
                  updateChecklist("niveaux", "liquideRefroidissement", value)
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Liquide de frein
              </label>
              <FluidSelect
                value={checklist.niveaux.liquideFrein}
                onChange={(value) =>
                  updateChecklist("niveaux", "liquideFrein", value)
                }
              />
            </div>
          </div>
        </Section>

        {/* 🧰 ÉQUIPEMENTS */}
        <Section id="equipements" title="Équipements" icon="🧰">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                key: "triangleSignalisation",
                label: "Triangle de signalisation",
              },
              { key: "giletSecurite", label: "Gilet de sécurité" },
              { key: "extincteur", label: "Extincteur" },
              { key: "trousseSecours", label: "Trousse de secours" },
              { key: "cric", label: "Cric" },
              { key: "cleRoues", label: "Clé à roues" },
              { key: "documentsBord", label: "Documents de bord" },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={
                    checklist.equipements[
                      item.key as keyof typeof checklist.equipements
                    ] as boolean
                  }
                  onChange={(e) =>
                    updateChecklist("equipements", item.key, e.target.checked)
                  }
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
