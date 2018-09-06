/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';

import { connect } from 'react-redux';

import {
  EuiButton,
  EuiButtonIcon,
  EuiCallOut,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiModal,
  EuiOverlayMask,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSearchBar,
  EuiSideNav,
  EuiTitle,
} from '@elastic/eui';

import { Link } from 'react-router-dom';

import { Repository } from '../../../model';
import { RepoConfigs } from '../../../model/workspace';
import { deleteRepo, importRepo, indexRepo, initRepoCommand } from '../../actions';
import { RootState } from '../../reducers';
import { FlexGrowContainer } from '../../styled_components/flex_grow_container';

enum Tabs {
  GitAddress,
  GitHub,
}

interface Props {
  repositories: Repository[];
  importLoading: boolean;
  deleteRepo: (uri: string) => void;
  indexRepo: (uri: string) => void;
  importRepo: (uri: string) => void;
  initRepoCommand: (uri: string) => void;
  repoConfigs?: RepoConfigs;
  hasImportError: boolean;
  importError?: Error;
}

interface State {
  isModalVisible: boolean;
  activeTab: Tabs;
  importRepoAddress: string;
  searchQuery: any;
}

interface RepositoryItemProps {
  repoName: string;
  repoURI: string;
  deleteRepo: () => void;
  indexRepo: () => void;
  initRepoCommand: () => void;
  hasInitCmd?: boolean;
}

const RepositoryItem = (props: RepositoryItemProps) => {
  const initRepoButton = (
    <EuiButtonIcon iconType="play" aria-label="run init command" onClick={props.initRepoCommand} />
  );

  return (
    <EuiFlexGroup className="repoItem" wrap={true} justifyContent="spaceBetween">
      <EuiFlexItem>
        <EuiFlexGroup direction="column" justifyContent="spaceBetween">
          <div>
            <Link to={`/${props.repoURI}/tree/master`}>{props.repoName}</Link>
          </div>
          <div>
            <a href={`//${props.repoURI}`} target="__blank">
              {props.repoURI}
            </a>
          </div>
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <div>
          {props.hasInitCmd && initRepoButton}
          <EuiButtonIcon iconType="indexSettings" aria-label="settings" />
          <EuiButtonIcon iconType="indexOpen" aria-label="index" onClick={props.indexRepo} />
          <EuiButtonIcon iconType="trash" aria-label="delete" onClick={props.deleteRepo} />
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const initialQuery = EuiSearchBar.Query.MATCH_ALL;

class AdminPage extends React.PureComponent<Props, State> {
  public state = {
    isModalVisible: false,
    activeTab: Tabs.GitAddress,
    importRepoAddress: '',
    searchQuery: initialQuery,
  };

  public getSideNavItems = () => {
    if (this.state.activeTab === Tabs.GitAddress) {
      return [
        {
          isSelected: true,
          name: 'Git Address',
          id: Tabs.GitAddress,
          onClick: this.getTabClickHandler(Tabs.GitAddress),
        },
        {
          isSelected: false,
          name: 'GitHub',
          id: Tabs.GitHub,
          onClick: this.getTabClickHandler(Tabs.GitHub),
        },
      ];
    } else if (this.state.activeTab === Tabs.GitHub) {
      return [
        {
          isSelected: false,
          name: 'Git Address',
          id: Tabs.GitAddress,
          onClick: this.getTabClickHandler(Tabs.GitAddress),
        },
        {
          isSelected: true,
          name: 'GitHub',
          id: Tabs.GitHub,
          onClick: this.getTabClickHandler(Tabs.GitHub),
        },
      ];
    } else {
      throw new Error('Unknown Tab');
    }
  };

  public onImportAddressChange = (e: React.MouseEvent<HTMLInputElement>) => {
    this.setState({ importRepoAddress: e.target.value });
  };

  public importRepo = () => {
    this.props.importRepo(this.state.importRepoAddress);
  };

  public getTabContent = () => {
    if (this.state.activeTab === Tabs.GitAddress) {
      return (
        <React.Fragment>
          <label className="addressInputLabel">Git Address:</label>
          <EuiFieldText
            className="importModalInput"
            placeholder=""
            value={this.state.importRepoAddress}
            onChange={this.onImportAddressChange}
            aria-label="Use aria labels when no actual label is in use"
          />
          <EuiButton
            onClick={this.importRepo}
            isLoading={this.props.importLoading}
            className="importModalButton"
          >
            Add
          </EuiButton>
        </React.Fragment>
      );
    } else if (this.state.activeTab === Tabs.GitHub) {
      return null;
    } else {
      throw new Error('Unknown Tab');
    }
  };

  public getTabClickHandler = (tab: Tabs) => () => {
    this.setState({ activeTab: tab });
  };

  public openModal = () => {
    this.setState({ isModalVisible: true });
  };

  public closeModal = () => {
    this.setState({ isModalVisible: false });
  };

  public getDeleteRepoHandler = (uri: string) => () => {
    this.props.deleteRepo(uri);
  };

  public getIndexRepoHandler = (uri: string) => () => {
    this.props.indexRepo(uri);
  };

  public onSearchQueryChange = (q: any) => {
    this.setState({
      searchQuery: q.query,
    });
  };

  public filterRepos = () => {
    const { text } = this.state.searchQuery;
    if (text) {
      return this.props.repositories.filter(repo =>
        repo.uri.toLowerCase().includes(text.toLowerCase())
      );
    } else {
      return this.props.repositories;
    }
  };

  public render() {
    const repos = this.filterRepos();
    const repositoriesCount = repos.length;
    const items = this.getSideNavItems();
    const { hasImportError, importError } = this.props;

    const errorCallOut = hasImportError &&
      importError && (
        <EuiCallOut title="Sorry, there was an error" color="danger" iconType="cross">
          {importError.message}
        </EuiCallOut>
      );

    const importRepositoryModal = (
      <EuiOverlayMask>
        <EuiModal onClose={this.closeModal} className="importModal">
          <EuiTitle size="s" className="importModalTitle">
            <h1>Import Repository</h1>
          </EuiTitle>
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiSideNav items={items} />
            </EuiFlexItem>
            <FlexGrowContainer>
              <EuiFlexItem className="tabContent">{this.getTabContent()}</EuiFlexItem>
              {errorCallOut}
            </FlexGrowContainer>
          </EuiFlexGroup>
        </EuiModal>
      </EuiOverlayMask>
    );

    const repoList = repos.map(repo => (
      <RepositoryItem
        key={repo.uri}
        repoName={repo.name || ''}
        repoURI={repo.uri}
        deleteRepo={this.getDeleteRepoHandler(repo.uri)}
        indexRepo={this.getIndexRepoHandler(repo.uri)}
        initRepoCommand={this.props.initRepoCommand.bind(this, repo.uri)}
        hasInitCmd={this.hasInitCmd(repo)}
      />
    ));

    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageContent>
            <EuiPageContentHeader>
              <EuiPageContentHeaderSection>
                <EuiTitle>
                  <h2>{repositoriesCount} repositories</h2>
                </EuiTitle>
              </EuiPageContentHeaderSection>
              <EuiPageContentHeaderSection>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiSearchBar className="searchBox" onChange={this.onSearchQueryChange} />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      className="addRepoButton"
                      onClick={this.openModal}
                      iconType="plusInCircle"
                      aria-label="add"
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPageContentHeaderSection>
            </EuiPageContentHeader>
            <EuiPageContentBody>
              <div>{repoList}</div>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
        {this.state.isModalVisible && importRepositoryModal}
      </EuiPage>
    );
  }

  private hasInitCmd(repo: Repository) {
    if (this.props.repoConfigs) {
      const config = this.props.repoConfigs[repo.uri];
      return config && !!config.init;
    }
    return false;
  }
}

const mapStateToProps = (state: RootState) => ({
  repositories: state.repository.repositories,
  importLoading: state.repository.importLoading,
  repoConfigs: state.repository.repoConfigs,
  hasImportError: state.repository.hasImportError,
  importError: state.repository.importError,
});

const mapDispatchToProps = {
  deleteRepo,
  importRepo,
  indexRepo,
  initRepoCommand,
};

export const Admin = connect(
  mapStateToProps,
  mapDispatchToProps
)(AdminPage);
