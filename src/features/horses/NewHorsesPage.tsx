import { Link } from 'react-router-dom'
import './NewHorsesPage.css'

export function NewHorsesPage() {
  return (
  <section className="new-horses-page">
    <header className="page-header">
      <p className="page-header__eyebrow">Novo cadastro</p>

      <h1 className="page-header__title">
        Novo cavalo
      </h1>

      <p className="page-header__description">
        Cadastre as informações principais do cavalo.
      </p>
    </header>

    <form className="new-horses-form">
      <div className="new-horses-form__grid">
        <div className="new-horses-field new-horses-field--full">
          <label htmlFor="name">Nome do cavalo</label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Ex: Apache"
          />
        </div>

        <div className="new-horses-field">
          <label htmlFor="breed">Raça</label>

          <input
            id="breed"
            name="breed"
            type="text"
            placeholder="Ex: Quarto de Milha"
          />
        </div>

        <div className="new-horses-field">
          <label htmlFor="sex">Sexo</label>

          <select id="sex" name="sex">
            <option value="">Selecione</option>
            <option value="male">Macho</option>
            <option value="female">Fêmea</option>
          </select>
        </div>

        <div className="new-horses-field">
          <label htmlFor="client">Cliente responsável</label>

          <select id="client" name="client">
            <option value="">Selecione um cliente</option>
            <option value="carlos">Carlos Henrique</option>
            <option value="mariana">Mariana Lopes</option>
            <option value="ricardo">Ricardo Almeida</option>
          </select>
        </div>

        <div className="new-horses-field">
          <label htmlFor="stall">Baia</label>

          <select id="stall" name="stall">
            <option value="">Selecione uma baia</option>
            <option value="04">Baia 04</option>
            <option value="08">Baia 08</option>
            <option value="12">Baia 12</option>
          </select>
        </div>
      </div>

      <div className="new-horses-form__actions">
        <Link
          className="new-horses-cancel"
          to="/cavalos"
        >
          Cancelar
        </Link>

        <button
          className="new-horses-submit"
          type="submit"
        >
          Cadastrar cavalo
        </button>
      </div>
    </form>
  </section>
)
}