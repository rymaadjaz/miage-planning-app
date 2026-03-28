import { useNavigate } from 'react-router-dom';

export default function BackButton({
  label = 'Retour',
  to,
  fallback = '/calendar',
  className = 'ens-btn-outline',
  style,
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallback);
  };

  return (
    <button type="button" className={className} style={style} onClick={handleClick}>
      {`← ${label}`}
    </button>
  );
}