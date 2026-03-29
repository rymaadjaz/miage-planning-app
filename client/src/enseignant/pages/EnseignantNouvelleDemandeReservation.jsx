import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { createDemande, getCohortes, getDemandes, getSalles } from '../../services/api';
import '../../styles/enseignant.css';

const TYPES = ['CM', 'TD', 'TP', 'EXAM'];

export default function EnseignantNouvelleDemandeReservation() {
  const navigate = useNavigate();
  const location = useLocation();
  const sourceReservationFromNav = location.state?.sourceReservation ?? null;
  const defaultMode = location.state?.mode === 'DEPLACEMENT' ? 'DEPLACEMENT' : 'CREATION';

  const [mode, setMode] = useState(defaultMode);
  const [sourceReservationId, setSourceReservationId] = useState(
    sourceReservationFromNav?.id ? String(sourceReservationFromNav.id) : ''
  );
  const [eligibleReservations, setEligibleReservations] = useState([]);

  const [form, setForm] = useState({ type: '', date: '', debut: '', fin: '', cohorte: '', salle: '' });
  const [error, setError] = useState('');
  const [cohortes, setCohortes] = useState([]);
  const [salles, setSalles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [cohortesRows, sallesRows, demandesRows] = await Promise.all([
          getCohortes(),
          getSalles(),
          getDemandes(),
        ]);
        if (!isMounted) return;
        setCohortes(cohortesRows);
        setSalles(sallesRows);

        const valides = (demandesRows || []).filter((d) => d.statut === 'VALIDÉE');
        setEligibleReservations(valides);
      } catch {
        if (!isMounted) return;
        setCohortes([]);
        setSalles([]);
        setEligibleReservations([]);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const fillFromSource = (sourceReservation) => {
    if (!sourceReservation) return;

    setForm({
      type: sourceReservation.type || '',
      date: sourceReservation.date || '',
      debut: sourceReservation.debut || '',
      fin: sourceReservation.fin || '',
      cohorte: sourceReservation.cohorteId ? String(sourceReservation.cohorteId) : '',
      salle: sourceReservation.salleId ? String(sourceReservation.salleId) : '',
    });
  };

  useEffect(() => {
    if (mode === 'DEPLACEMENT' && sourceReservationFromNav) {
      fillFromSource(sourceReservationFromNav);
    }
  }, [mode, sourceReservationFromNav]);

  useEffect(() => {
    if (mode !== 'DEPLACEMENT') return;
    const selected = eligibleReservations.find((d) => String(d.id) === String(sourceReservationId));
    if (selected) {
      fillFromSource(selected);
    }
  }, [mode, sourceReservationId, eligibleReservations]);

  const setField = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async () => {
    const required = ['type', 'date', 'debut', 'fin', 'cohorte', 'salle'];
    if (required.some((k) => !form[k])) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (form.debut >= form.fin) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }

    if (mode === 'DEPLACEMENT' && !sourceReservationId) {
      setError('Veuillez sélectionner la réservation à déplacer.');
      return;
    }

    setError('');

    try {
      const payload = {
        type: form.type,
        date: form.date,
        debut: form.debut,
        fin: form.fin,
        cohorte_id: Number(form.cohorte),
        salle_id: Number(form.salle),
      };

      if (mode === 'DEPLACEMENT') {
        payload.demande_type = 'DEPLACEMENT';
        payload.source_reservation_id = Number(sourceReservationId);
      }

      await createDemande(payload);
      navigate('/enseignant/demandes');
    } catch (apiErr) {
      setError(apiErr.message || "Envoi impossible.");
    }
  };

  return (
    <div className="ens-page">
      <Navbar />
      <div className="ens-content" style={{ maxWidth: 680 }}>
        <div className="ens-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {mode === 'DEPLACEMENT' ? 'Demande de déplacement' : 'Nouvelle demande'}
            </h1>
            <button className="ens-btn-ghost" onClick={() => navigate('/enseignant/demandes')}>
              ← Retour aux demandes
            </button>
          </div>

          {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

          <div className="ens-form">
            <div className="ens-field">
              <label>Type de demande <span>*</span></label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="CREATION">Nouvelle réservation</option>
                <option value="DEPLACEMENT">Déplacement d'un créneau existant</option>
              </select>
            </div>

            {mode === 'DEPLACEMENT' && (
              <div className="ens-field">
                <label>Créneau à déplacer <span>*</span></label>
                <select
                  value={sourceReservationId}
                  onChange={(e) => setSourceReservationId(e.target.value)}
                >
                  <option value="">Sélectionner une réservation validée</option>
                  {eligibleReservations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {`${d.type} - ${d.date} ${d.debut}-${d.fin} - ${d.cohorte} - ${d.salle}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ens-form-row">
              <div className="ens-field">
                <label>Type de séance <span>*</span></label>
                <select value={form.type} onChange={setField('type')}>
                  <option value="">Sélectionner</option>
                  {TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div className="ens-field">
                <label>Date <span>*</span></label>
                <input type="date" value={form.date} onChange={setField('date')} />
              </div>
            </div>

            <div className="ens-form-row">
              <div className="ens-field">
                <label>Heure de début <span>*</span></label>
                <input type="time" value={form.debut} onChange={setField('debut')} />
              </div>
              <div className="ens-field">
                <label>Heure de fin <span>*</span></label>
                <input type="time" value={form.fin} onChange={setField('fin')} />
              </div>
            </div>

            <div className="ens-form-row">
              <div className="ens-field">
                <label>Cohorte <span>*</span></label>
                <select value={form.cohorte} onChange={setField('cohorte')}>
                  <option value="">Sélectionner</option>
                  {cohortes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>
              <div className="ens-field">
                <label>Salle souhaitée <span>*</span></label>
                <select value={form.salle} onChange={setField('salle')}>
                  <option value="">Sélectionner</option>
                  {salles.map((s) => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button className="ens-btn" onClick={submit}>
                {mode === 'DEPLACEMENT' ? 'Envoyer le déplacement' : 'Envoyer la demande'}
              </button>
              <button className="ens-btn-outline" onClick={() => navigate('/enseignant/demandes')}>Annuler</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
